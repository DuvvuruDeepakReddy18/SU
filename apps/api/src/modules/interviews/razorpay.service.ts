import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Razorpay integration. Activated by setting RAZORPAY_KEY_ID and
 * RAZORPAY_KEY_SECRET in env. Until then every method throws 503 so the
 * UI's "Free during beta" path stays the source of truth.
 *
 * RAZORPAY_INTERVIEW_PRICE_PAISE: charge per interview in paise (₹499 = 49900).
 *   Defaults to 49900 if unset.
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
   * Create a Razorpay order the user will pay against. The order's receipt
   * is `iv_<userId>_<random>` so we can match a webhook back to the user
   * even if the frontend drops the response.
   */
  async createInterviewOrder(userId: string) {
    if (!this.client) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Razorpay is not configured. Booking remains free during beta.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const order = await this.client.orders.create({
      amount: this.priceInPaise,
      currency: 'INR',
      receipt: `iv_${userId.slice(0, 8)}_${randomBytes(6).toString('hex')}`,
      notes: { product: 'l4_interview', userId },
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
   * Verify the signed payment response Razorpay sends back to the
   * frontend after checkout. If it matches, atomically create the booking
   * and stamp it with the Razorpay ids.
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
    if (expected !== body.signature) {
      throw new BadRequestException('Razorpay signature mismatch.');
    }

    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
      throw new BadRequestException('scheduledAt must be a future ISO timestamp.');
    }

    const meetingUrl = `https://meet.jit.si/skillverify-${randomBytes(8).toString('hex')}`;

    return this.prisma.interviewBooking.create({
      data: {
        userId,
        skillId: body.skillId ?? null,
        scheduledAt,
        notes: body.notes ?? null,
        status: 'scheduled',
        meetingUrl,
        razorpayOrderId: body.orderId,
        razorpayPaymentId: body.paymentId,
        amountInrPaise: this.priceInPaise,
        paidAt: new Date(),
      },
    });
  }
}
