-- Server-side idempotency cache. See IdempotencyKey model in schema.prisma.
CREATE TABLE "IdempotencyKey" (
  "key" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "IdempotencyKey_key_userId_route_key" ON "IdempotencyKey"("key", "userId", "route");
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");
