-- CreateTable
CREATE TABLE "AiScreenAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT,
    "skillName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "passed" BOOLEAN,
    "areaBreakdown" JSONB,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AiScreenAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiScreenAttempt_userId_createdAt_idx" ON "AiScreenAttempt"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiScreenAttempt" ADD CONSTRAINT "AiScreenAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

