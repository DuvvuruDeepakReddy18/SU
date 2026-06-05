import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator';

// Orchestrators poll /health on a tight loop — never throttle it (and /config,
// which the frontend fetches on every page load).
@SkipThrottle()
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'skillverify-api', timestamp: new Date().toISOString() };
  }

  // Feature flags so the frontend can hide UI for disabled integrations.
  // Driven entirely by env-var presence — set the relevant keys to flip a
  // feature on. Keep this in sync with apps/web/lib/use-config.ts.
  @Public()
  @Get('config')
  config() {
    return {
      storage: !!(process.env.S3_ENDPOINT && process.env.S3_KEY && process.env.S3_SECRET),
      ai: !!process.env.OPENROUTER_API_KEY,
      github: !!process.env.GITHUB_CLIENT_ID,
      google: !!process.env.GOOGLE_CLIENT_ID,
      // Paid features — off until you wire up real credentials.
      razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      digiLocker: !!process.env.DIGILOCKER_CLIENT_ID,
      // L4 expert screen is built but the interviewer panel module isn't.
      expertScreen: process.env.EXPERT_SCREEN_ENABLED === 'true',
    };
  }
}
