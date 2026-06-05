import { describe, it, expect } from 'vitest';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './app.module';

/**
 * Regression guard for a real bug: ThrottlerModule was configured but the
 * ThrottlerGuard was never registered as a global guard, so rate limiting was
 * silently inert on every route. This asserts the guard is wired so it can't
 * regress unnoticed.
 */
describe('AppModule', () => {
  it('registers ThrottlerGuard globally (rate limiting is actually enforced)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providers: any[] = Reflect.getMetadata('providers', AppModule) ?? [];
    const enforced = providers.some(
      (p) => p && p.provide === APP_GUARD && p.useClass === ThrottlerGuard,
    );
    expect(enforced).toBe(true);
  });
});
