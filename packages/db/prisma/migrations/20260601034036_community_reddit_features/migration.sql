-- AlterTable
ALTER TABLE "CommunityComment" ADD COLUMN     "hiddenByMod" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentCommentId" TEXT;

-- AlterTable
ALTER TABLE "CommunityPost" ADD COLUMN     "hiddenByMod" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subreddit" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "CommunityComment_parentCommentId_idx" ON "CommunityComment"("parentCommentId");

-- CreateIndex
CREATE INDEX "CommunityPost_subreddit_score_idx" ON "CommunityPost"("subreddit", "score");

-- CreateIndex
CREATE INDEX "CommunityPost_score_idx" ON "CommunityPost"("score");

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
