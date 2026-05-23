import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
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
