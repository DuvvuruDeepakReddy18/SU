import { Logger } from '@nestjs/common';

const log = new Logger('EnvValidation');

// Known dev fallbacks. If any of these literal values is in use, the secret
// is effectively unset — fine locally, fatal in production.
const DEV_FALLBACKS: Record<string, string> = {
  JWT_SECRET: 'dev-only-secret-change-me',
  ENCRYPTION_KEY: 'dev-only-encryption-key-please-change',
};

// Secrets that MUST be set (and not left at the dev fallback) before the API
// is allowed to boot in production.
const REQUIRED_IN_PROD = ['JWT_SECRET', 'ENCRYPTION_KEY', 'DATABASE_URL'] as const;

/**
 * Fail-fast environment validation.
 *
 * In production a missing or dev-fallback secret is a hard error — the process
 * exits rather than booting with a guessable JWT signing key or a placeholder
 * encryption key (which would silently make every signed token forgeable and
 * every stored OAuth token decryptable by anyone reading the source).
 *
 * Outside production we only warn, so local dev and CI keep working with the
 * built-in fallbacks.
 */
export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const problems: string[] = [];

  for (const key of REQUIRED_IN_PROD) {
    const val = process.env[key];
    const fallback = DEV_FALLBACKS[key];
    if (!val) {
      problems.push(`${key} is not set.`);
    } else if (fallback && val === fallback) {
      problems.push(`${key} is still the insecure dev default — set a real value.`);
    }
  }

  if (problems.length === 0) return;

  if (isProd) {
    log.error('Refusing to start — production environment is misconfigured:');
    for (const p of problems) log.error(`  • ${p}`);
    // Exit non-zero so orchestrators (Docker/Render/Fly) mark the deploy failed
    // instead of running an insecure instance.
    process.exit(1);
  } else {
    log.warn('Using insecure dev defaults for some secrets (fine locally, NOT for prod):');
    for (const p of problems) log.warn(`  • ${p}`);
  }
}
