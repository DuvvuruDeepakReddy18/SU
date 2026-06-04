-- Soft-delete tombstone for User. All read paths must filter on
-- `deletedAt IS NULL` so deleted users disappear without losing the rows
-- they own (comments, applications, posts) and breaking referential threads.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
