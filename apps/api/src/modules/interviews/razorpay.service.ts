import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** Constant-time hex-string compare (avoids signature timing leaks). */
function signaturesMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Razorpay integration. Activated by setting RAZORPAY_KEY_ID and
 * RAZORPAY_KEY_SECRET in env. Until then every method throws 503 so the
 * UI's "Free during beta" path stays the source of truth.
 *
 * Env vars:
 *   RAZORPAY_KEY_ID                — public key from dashboard.razorpay.com
 *   RAZORPAY_KEY_SECRET            — used to sign / verify checkout responses
 *   RAZORPAY_WEBHOOK_SECRET        — separate secret from the dashboard's
 *                                    Webhooks tab (NOT the key secret above)
 *   RAZORPAY_INTERVIEW_PRICE_PAISE — defaults to 49900 (₹499)
 */
@Injectable()
export class RazorpayService {
  private readonly log = new Logger(RazorpayService.name);
  private readonly client: Razorpay | null;
  private readonly priceInPaise: number;
  readonly keyId: string | null;

  constructor(private readonly prisma: PrismaService) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.keyId = keyId ?? null;
    this.priceInPaise = Number(process.env.RAZORPAY_INTERVIEW_PRICE_PAISE ?? 49900);
    if (!keyId || !keySecret) {
      this.log.warn('Razorpay not configured — payment endpoints will return 503.');
      this.client = null;
      return;
    }
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Create a Razorpay order the user will pay against. All metadata needed
   * to reconstruct the booking (userId, scheduledAt, notes, skillId) is
   * stashed in the order's `notes` field, so a webhook can finish the
   * booking even if the frontend never calls /verify-and-book.
   *
   * `scheduledAt` MUST be provided at order-creation time (a flip from the
   * earlier flow where the slot was picked after payment).
   */
  async createInterviewOrder(input: {
    userId: string;
    scheduledAt: string;
    notes?: string;
    skillId?: string;
  }) {
    if (!this.client) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Razorpay is not configured. Booking remains free during beta.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const scheduledDate = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() < Date.now()) {
      throw new BadRequestException('scheduledAt must be a future ISO timestamp.');
    }

    const order = await this.client.orders.create({
      amount: this.priceInPaise,
      currency: 'INR',
      receipt: `iv_${input.userId.slice(0, 8)}_${randomBytes(6).toString('hex')}`,
      notes: {
        product: 'l4_interview',
        userId: input.userId,
        scheduledAt: scheduledDate.toISOString(),
        notes: input.notes ?? '',
        skillId: input.skillId ?? '',
      },
    });
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.keyId,
      receipt: order.receipt,
    };
  }

  /**
   * Verify the signed payment response Razorpay sends back to the frontend
   * after checkout. Idempotent — if a booking already exists for this
   * `orderId` (e.g. the webhook beat us to it), returns it instead of
   * creating a duplicate.
   *
   * Expected body: { orderId, paymentId, signature, scheduledAt, notes?, skillId? }
   */
  async verifyAndBook(
    userId: string,
    body: {
      orderId: string;
      paymentId: string;
      signature: string;
      scheduledAt: string;
      notes?: string;
      skillId?: string;
    },
  ) {
    if (!this.client) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Razorpay is not configured.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (!body.orderId || !body.paymentId || !body.signature) {
      throw new BadRequestException('orderId, paymentId, and signature are required.');
    }
    const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
    const expected = createHmac('sha256', secret)
      .update(`${body.orderId}|${body.paymentId}`)
      .digest('hex');
    if (!signaturesMatch(expected, body.signature)) {
      throw new BadRequestException('Razorpay signature mismatch.');
    }

    return this.ensureBooking({
      userId,
      orderId: body.orderId,
      paymentId: body.paymentId,
      scheduledAt: body.scheduledAt,
      notes: body.notes,
      skillId: body.skillId,
    });
  }

  /**
   * Webhook entrypoint. Razorpay calls this server-to-server after a
   * payment is captured. Validates HMAC against the rawBody, then creates
   * the booking using metadata stashed in the order's `notes`.
   *
   * Razorpay docs: https://razorpay.com/docs/webhooks/validate-test/
   */
  async handleWebhookEvent(rawBody: Buffer, signature: string | undefined) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      this.log.warn('Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is unset.');
      throw new HttpException(
        { message: 'Webhook not configured.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (!signature) {
      throw new BadRequestException('Missing X-Razorpay-Signature header.');
    }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!signaturesMatch(expected, signature)) {
      this.log.warn('Razorpay webhook signature mismatch.');
      throw new HttpException({ message: 'Invalid signature.' }, HttpStatus.UNAUTHORIZED);
    }

    type WebhookEvent = {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            notes?: Record<string, string>;
          };
        };
        order?: { entity?: { id?: string; notes?: Record<string, string> } };
      };
    };
    let event: WebhookEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as WebhookEvent;
    } catch {
      throw new BadRequestException('Webhook body is not valid JSON.');
    }

    // We only act on payment.captured. Razorpay sends many other event kinds
    // (authorized, failed, refunded) — ack with 200 so they stop retrying,
    // but don't do anything else.
    if (event.event !== 'payment.captured') {
      return { ok: true, ignored: true, event: event.event };
    }

    const payment = event.payload?.payment?.entity;
    if (!payment?.id || !payment.order_id) {
      this.log.warn('payment.captured event missing payment.id / order_id.');
      return { ok: true, ignored: true };
    }

    // Notes are on the order, not the payment. We rely on Razorpay echoing
    // them back on the payment too (it does for most payment kinds), but if
    // they're missing we look up the order via the client.
    const notes = payment.notes ?? (await this.fetchOrderNotes(payment.order_id));
    if (notes?.product !== 'l4_interview' || !notes.userId || !notes.scheduledAt) {
      this.log.warn(`Webhook for order ${payment.order_id} missing expected notes.`);
      return { ok: true, ignored: true };
    }

    const booking = await this.ensureBooking({
      userId: notes.userId,
      orderId: payment.order_id,
      paymentId: payment.id,
      scheduledAt: notes.scheduledAt,
      notes: notes.notes || undefined,
      skillId: notes.skillId || undefined,
    });
    return { ok: true, created: !booking.alreadyExisted, bookingId: booking.booking.id };
  }

  /**
   * Idempotent booking-creation helper. If a booking already exists for the
   * given Razorpay order id, return it untouched. Otherwise create one and
   * stamp the payment fields.
   */
  private async ensureBooking(input: {
    userId: string;
    orderId: string;
    paymentId: string;
    scheduledAt: string;
    notes?: string;
    skillId?: string;
  }) {
    const existing = await this.prisma.interviewBooking.findFirst({
      where: { razorpayOrderId: input.orderId },
    });
    if (existing) {
      return { booking: existing, alreadyExisted: true };
    }

    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('scheduledAt is not a valid ISO timestamp.');
    }

    const meetingUrl = `https://meet.jit.si/skillverify-${randomBytes(8).toString('hex')}`;
    const booking = await this.prisma.interviewBooking.create({
      data: {
        userId: input.userId,
        skillId: input.skillId || null,
        scheduledAt,
        notes: input.notes ?? null,
        status: 'scheduled',
        meetingUrl,
        razorpayOrderId: input.orderId,
        razorpayPaymentId: input.paymentId,
        amountInrPaise: this.priceInPaise,
        paidAt: new Date(),
      },
    });
    return { booking, alreadyExisted: false };
  }

  private async fetchOrderNotes(orderId: string): Promise<Record<string, string> | null> {
    if (!this.client) return null;
    try {
      const order = await this.client.orders.fetch(orderId);
      return (order.notes ?? null) as Record<string, string> | null;
    } catch (e) {
      this.log.warn(`Failed to fetch order ${orderId}: ${(e as Error).message}`);
      return null;
    }
  }
}
