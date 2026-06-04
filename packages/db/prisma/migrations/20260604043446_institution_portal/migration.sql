-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "institutionId" TEXT,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'public';

-- CreateTable
CREATE TABLE "InstitutionAdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "fullName" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionAdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionAdminProfile_userId_key" ON "InstitutionAdminProfile"("userId");

-- CreateIndex
CREATE INDEX "InstitutionAdminProfile_institutionId_idx" ON "InstitutionAdminProfile"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionAdminProfile_status_createdAt_idx" ON "InstitutionAdminProfile"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Competition_institutionId_idx" ON "Competition"("institutionId");

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionAdminProfile" ADD CONSTRAINT "InstitutionAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionAdminProfile" ADD CONSTRAINT "InstitutionAdminProfile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
