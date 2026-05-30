-- AlterTable
ALTER TABLE "FreelanceService" ADD COLUMN     "geoLat" DOUBLE PRECISION,
ADD COLUMN     "geoLng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "FreelanceInquiry" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "budgetInr" DOUBLE PRECISION,
    "deadlineAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "providerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreelanceInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreelanceMessage" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreelanceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreelanceInquiry_clientId_createdAt_idx" ON "FreelanceInquiry"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "FreelanceInquiry_providerId_createdAt_idx" ON "FreelanceInquiry"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "FreelanceMessage_inquiryId_createdAt_idx" ON "FreelanceMessage"("inquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "FreelanceInquiry" ADD CONSTRAINT "FreelanceInquiry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "FreelanceService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelanceInquiry" ADD CONSTRAINT "FreelanceInquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelanceInquiry" ADD CONSTRAINT "FreelanceInquiry_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelanceMessage" ADD CONSTRAINT "FreelanceMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "FreelanceInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelanceMessage" ADD CONSTRAINT "FreelanceMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
