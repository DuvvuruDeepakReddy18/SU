import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import * as Sentry from '@sentry/node';

/**
 * Global error handler — logs full stack on the server side, and in development
 * returns the actual error message + class name in the HTTP response so callers
 * (us, the browser console) can see what really failed instead of just
 * "Internal server error".
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new Logger('Exception');
  // Only surface raw error detail in an explicit dev/test env. Anything else
  // (production, staging, preview, or a misconfigured NODE_ENV) masks internals
  // — a leaked Prisma/driver message exposes table + column names. Unset counts
  // as dev so local `nest start` (no NODE_ENV) still shows detail.
  private readonly isDev =
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ method: string; url: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      // getResponse() is a string OR { message: string | string[], error, ... }.
      // Flatten to a single human-readable string so the client never has to
      // dig through a nested object (which used to leak raw JSON into toasts).
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const m = (resp as { message?: unknown; error?: unknown }).message;
        if (Array.isArray(m)) message = m.join(', ');
        else if (typeof m === 'string') message = m;
        else if (typeof (resp as { error?: unknown }).error === 'string')
          message = (resp as { error: string }).error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Production: never leak internals from an unexpected (non-HTTP) error — a
    // raw Prisma/driver message exposes table + column names. HttpException
    // messages (BadRequest, Forbidden, …) are deliberate and safe to surface.
    if (!this.isDev && !(exception instanceof HttpException)) {
      message = 'Internal server error';
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.log.error(`${req.method} ${req.url} -> ${status}: ${err.message}`, err.stack);

    // Forward 5xx + non-HTTP errors to Sentry (skip 4xx — those are
    // expected user errors, would drown out real signal). No-op when
    // SENTRY_DSN isn't set (Sentry.init bails silently).
    if (status >= 500 || !(exception instanceof HttpException)) {
      Sentry.withScope((scope) => {
        scope.setTag('http.method', req.method);
        scope.setTag('http.url', req.url);
        scope.setLevel('error');
        Sentry.captureException(err);
      });
    }

    res.status(status).json({
      statusCode: status,
      message,
      ...(this.isDev && exception instanceof Error ? { error: err.name, detail: err.message } : {}),
    });
  }
}
