import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Global error handler — logs full stack on the server side, and in development
 * returns the actual error message + class name in the HTTP response so callers
 * (us, the browser console) can see what really failed instead of just
 * "Internal server error".
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new Logger('Exception');
  private readonly isDev = process.env.NODE_ENV !== 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ method: string; url: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.log.error(`${req.method} ${req.url} -> ${status}: ${err.message}`, err.stack);

    res.status(status).json({
      statusCode: status,
      message,
      ...(this.isDev && exception instanceof Error ? { error: err.name, detail: err.message } : {}),
    });
  }
}
