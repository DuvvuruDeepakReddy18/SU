-- AlterTable
ALTER TABLE "InterviewBooking" ADD COLUMN     "baseAmountPaise" INTEGER,
ADD COLUMN     "gstAmountPaise" INTEGER,
ADD COLUMN     "panelist2Id" TEXT,
ADD COLUMN     "publicVisibility" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "reviewReleasedAt" TIMESTAMP(3),
ADD COLUMN     "slotId" TEXT,
ADD COLUMN     "transcript" TEXT,
ALTER COLUMN "status" SET DEFAULT 'booked';

-- AlterTable
ALTER TABLE "InterviewerProfile" ADD COLUMN     "licenseDueAt" TIMESTAMP(3),
ADD COLUMN     "licenseRenewedAt" TIMESTAMP(3),
ADD COLUMN     "licenseStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "minDailyCommitment" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "InterviewSlot" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,
    "panelSize" INTEGER NOT NULL DEFAULT 2,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewerPayout" (
    "id" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossAmountPaise" INTEGER NOT NULL,
    "tdsDeductedPaise" INTEGER NOT NULL DEFAULT 0,
    "netAmountPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewerPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewSlot_startsAt_idx" ON "InterviewSlot"("startsAt");

-- CreateIndex
CREATE INDEX "InterviewSlot_domain_startsAt_idx" ON "InterviewSlot"("domain", "startsAt");

-- CreateIndex
CREATE INDEX "InterviewerPayout_interviewerId_idx" ON "InterviewerPayout"("interviewerId");

-- CreateIndex
CREATE INDEX "InterviewerPayout_status_idx" ON "InterviewerPayout"("status");

-- CreateIndex
CREATE INDEX "InterviewBooking_panelist2Id_idx" ON "InterviewBooking"("panelist2Id");

-- CreateIndex
CREATE INDEX "InterviewBooking_slotId_idx" ON "InterviewBooking"("slotId");

-- CreateIndex
CREATE INDEX "InterviewerProfile_licenseStatus_idx" ON "InterviewerProfile"("licenseStatus");

-- AddForeignKey
ALTER TABLE "InterviewBooking" ADD CONSTRAINT "InterviewBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "InterviewSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBooking" ADD CONSTRAINT "InterviewBooking_panelist2Id_fkey" FOREIGN KEY ("panelist2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewerPayout" ADD CONSTRAINT "InterviewerPayout_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

