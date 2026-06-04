import 'reflect-metadata';
import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from './common/validate-env';

// Hard-fail in production if required secrets are missing or left at their
// insecure dev defaults. Warns (but continues) in dev / CI.
validateEnv();

// Initialize Sentry *before* any other module imports so it can hook into
// async I/O. No-op if SENTRY_DSN is unset, so dev / CI run unaffected.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    release: process.env.SENTRY_RELEASE,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Preserve the raw HTTP body on every request so webhook handlers
    // (Razorpay first, others later) can recompute HMAC signatures over the
    // exact bytes Razorpay sent. Without this, JSON.stringify reformatting
    // would break signature verification.
    rawBody: true,
  });

  app.use(helmet());
  // Multiple comma-separated origins via CORS_ORIGINS, plus a *.vercel.app
  // wildcard so PR previews work without re-deploying.
  const explicit = (process.env.CORS_ORIGINS ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / curl
      if (explicit.includes(origin)) return cb(null, true);
      if (/\.vercel\.app$/.test(new URL(origin).hostname)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  // Global pipe validates Zod DTOs (createZodDto) and passes other types through.
  app.useGlobalPipes(new ZodValidationPipe());

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`SkillVerify API running on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap();
