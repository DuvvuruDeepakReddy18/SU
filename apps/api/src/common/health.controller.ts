import { Controller, Get } from '@nestjs/common';
import { Public } from './decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'skillverify-api', timestamp: new Date().toISOString() };
  }

  // Feature flags so the frontend can hide UI for disabled integrations.
  @Public()
  @Get('config')
  config() {
    return {
      storage: !!(process.env.S3_ENDPOINT && process.env.S3_KEY && process.env.S3_SECRET),
      ai: !!process.env.OPENROUTER_API_KEY,
      github: !!process.env.GITHUB_CLIENT_ID,
      google: !!process.env.GOOGLE_CLIENT_ID,
    };
  }
}
