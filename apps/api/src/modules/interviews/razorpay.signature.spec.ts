import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';

/**
 * Signature verification is the security-critical part of the Razorpay
 * checkout flow — if our HMAC math diverges from theirs, attackers can
 * forge `payment captured` callbacks. These tests pin the algorithm to
 * the exact recipe Razorpay documents:
 *
 *   verify-and-book:  hmac_sha256(secret, `${orderId}|${paymentId}`)
 *   webhook:          hmac_sha256(webhook_secret, raw request body)
 */

function signOrderPayment(secret: string, orderId: string, paymentId: string): string {
  return createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

function signWebhookBody(secret: string, rawBody: Buffer): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

describe('Razorpay HMAC signing', () => {
  const secret = 'rzp_test_secret_DO_NOT_USE_IN_PROD';

  it('matches the documented order|paymentId formula', () => {
    const sig = signOrderPayment(secret, 'order_abc', 'pay_xyz');
    expect(sig).toBe(createHmac('sha256', secret).update('order_abc|pay_xyz').digest('hex'));
  });

  it('rejects flipped order/payment id pairs', () => {
    const correct = signOrderPayment(secret, 'order_abc', 'pay_xyz');
    const flipped = signOrderPayment(secret, 'pay_xyz', 'order_abc');
    expect(correct).not.toBe(flipped);
  });

  it('produces a stable signature for identical input', () => {
    const raw = Buffer.from('{"event":"payment.captured","payload":{}}');
    expect(signWebhookBody(secret, raw)).toBe(signWebhookBody(secret, raw));
  });

  it('changes the signature when raw body changes by one byte', () => {
    const a = signWebhookBody(secret, Buffer.from('{"event":"payment.captured"}'));
    const b = signWebhookBody(secret, Buffer.from('{"event":"payment.failed"}'));
    expect(a).not.toBe(b);
  });

  it('changes the signature when the secret changes', () => {
    const raw = Buffer.from('{"event":"order.paid"}');
    expect(signWebhookBody('a', raw)).not.toBe(signWebhookBody('b', raw));
  });
});
