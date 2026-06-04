import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import type { Request } from 'express';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { JwtPayload } from '@skillverify/shared';

const HEADER = 'idempotency-key';
const TTL_HOURS = 24;
const MAX_KEY_LEN = 80;

/**
 * Stripe-style idempotency. Clients pass `Idempotency-Key: <uuid>` on POST
 * requests; the first response is cached for 24h, and any retry within that
 * window gets served the original response (same status, same body) instead
 * of creating a duplicate row.
 *
 * Apply with `@UseInterceptors(IdempotencyInterceptor)` on endpoints that
 * create domain rows where double-create would be a bug (booking,
 * application, payment order, post). Reads + idempotent updates do not need
 * it.
 *
 * Implementation notes:
 *  - Cache row is keyed by `(key, userId, route)`. Scoping by user prevents
 *    cross-account collisions; scoping by route prevents one client using
 *    the same UUID across two distinct endpoints.
 *  - Missing header → no caching, request runs normally. Authenticated
 *    routes only — anonymous requests have no userId to scope against, so
 *    the interceptor skips them.
 *  - Failed requests are NOT cached (status >= 400) — the client should be
 *    able to retry after fixing the input.
 *  - Cache TTL is 24h; cleanup is opportunistic (a cron later). Until then,
 *    the table grows but the unique index keeps lookups O(1).
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly log = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const key = (req.headers[HEADER] as string | undefined)?.trim();
    const user = req.user;

    // Skip if header missing, unauthenticated, or key too long (defensive
    // — keep the @id column happy).
    if (!key || !user || key.length > MAX_KEY_LEN) {
      return next.handle();
    }

    const route = `${req.method} ${req.route?.path ?? req.path}`;

    return from(
      this.prisma.idempotencyKey.findFirst({
        where: { key, userId: user.sub, route, expiresAt: { gt: new Date() } },
      }),
    ).pipe(
      switchMap((cached) => {
        if (cached) {
          // Serve the cached response. We can't replay status code through
          // an interceptor cleanly (Nest already wrote headers by this
          // point if we tried), so we mutate the response status here.
          const res = context.switchToHttp().getResponse();
          res.status(cached.statusCode);
          return of(cached.responseBody);
        }
        return next.handle().pipe(
          tap((body) => {
            const res = context.switchToHttp().getResponse();
            const statusCode = res.statusCode as number;
            // Don't cache errors — let the client retry with corrected input.
            if (statusCode >= 400) return;
            const expiresAt = new Date(Date.now() + TTL_HOURS * 3600 * 1000);
            this.prisma.idempotencyKey
              .create({
                data: {
                  key,
                  userId: user.sub,
                  route,
                  statusCode,
                  responseBody: (body as object) ?? {},
                  expiresAt,
                },
              })
              .catch((e) => {
                // Race condition: two concurrent requests with the same key
                // hit the create at the same time. The unique index makes
                // the second one fail — fine, the cache wins on the next
                // retry. Don't surface this to the caller.
                this.log.debug(`Idempotency cache write skipped (${(e as Error).message})`);
              });
          }),
        );
      }),
    );
  }
}
