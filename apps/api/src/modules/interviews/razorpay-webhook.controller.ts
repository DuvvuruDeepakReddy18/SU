import { Controller, Headers, HttpCode, Post, RawBodyRequest, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RazorpayService } from './razorpay.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Razorpay sends `payment.captured` (and many other) events to this URL
 * after a successful checkout. We validate the X-Razorpay-Signature header
 * against the raw body bytes using RAZORPAY_WEBHOOK_SECRET, then dispatch.
 *
 * MUST be publicly reachable — no JWT guard. Razorpay won't authenticate.
 * The HMAC check is the only protection.
 *
 * Configure in dashboard.razorpay.com → Webhooks:
 *   URL    : {PUBLIC_API_URL}/api/v1/webhooks/razorpay
 *   Secret : same value as RAZORPAY_WEBHOOK_SECRET env var
 *   Events : payment.captured (sufficient for v1)
 */
@Controller('webhooks/razorpay')
export class RazorpayWebhookController {
  constructor(private readonly razorpay: RazorpayService) {}

  @Public()
  @HttpCode(200) // Razorpay treats any 2xx as ack; always return 200 once HMAC passes.
  @Post()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string | undefined,
  ) {
    // app.create({ rawBody: true }) in main.ts gives us req.rawBody as a Buffer.
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');
    return this.razorpay.handleWebhookEvent(raw, signature);
  }
}
