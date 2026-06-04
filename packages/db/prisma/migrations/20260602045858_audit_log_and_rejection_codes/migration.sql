-- AlterTable
ALTER TABLE "AcademicRecord" ADD COLUMN     "rejectionReasonCode" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "collegeIdRejectionReasonCode" TEXT;

-- CreateTable
CREATE TABLE "VerificationAudit" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reasonCode" TEXT,
    "reasonNote" TEXT,
    "previousState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationAudit_targetType_targetId_createdAt_idx" ON "VerificationAudit"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationAudit_actorUserId_createdAt_idx" ON "VerificationAudit"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationAudit" ADD CONSTRAINT "VerificationAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
