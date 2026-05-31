-- AlterTable
ALTER TABLE "AcademicRecord" ADD COLUMN     "examDate" TIMESTAMP(3),
ADD COLUMN     "extractedInstitution" TEXT,
ADD COLUMN     "extractedName" TEXT,
ADD COLUMN     "fileSha256" TEXT,
ADD COLUMN     "ocrExtracted" JSONB,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "AcademicRecord_fileSha256_idx" ON "AcademicRecord"("fileSha256");
