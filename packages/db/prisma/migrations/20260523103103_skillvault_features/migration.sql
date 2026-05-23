-- CreateTable
CREATE TABLE "PracticeDomain" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PracticeDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "panelNotes" TEXT,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementDrive" (
    "id" TEXT NOT NULL,
    "postedById" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT,
    "packageLpa" DOUBLE PRECISION,
    "minLevel" TEXT NOT NULL DEFAULT 'L0',
    "jobType" TEXT NOT NULL DEFAULT 'full_time',
    "skills" TEXT[],
    "location" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'institute_only',
    "institutionId" TEXT,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementApplication" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prizes" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "bannerUrl" TEXT,
    "postedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionEntry" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionUrl" TEXT,
    "notes" TEXT,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreelanceService" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceFrom" DOUBLE PRECISION,
    "priceUnit" TEXT,
    "skills" TEXT[],
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreelanceService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DomainProblems" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeDomain_slug_key" ON "PracticeDomain"("slug");

-- CreateIndex
CREATE INDEX "InterviewBooking_userId_scheduledAt_idx" ON "InterviewBooking"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "PlacementDrive_institutionId_idx" ON "PlacementDrive"("institutionId");

-- CreateIndex
CREATE INDEX "PlacementDrive_jobType_idx" ON "PlacementDrive"("jobType");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementApplication_driveId_userId_key" ON "PlacementApplication"("driveId", "userId");

-- CreateIndex
CREATE INDEX "Competition_category_startsAt_idx" ON "Competition"("category", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionEntry_competitionId_userId_key" ON "CompetitionEntry"("competitionId", "userId");

-- CreateIndex
CREATE INDEX "FreelanceService_category_idx" ON "FreelanceService"("category");

-- CreateIndex
CREATE INDEX "FreelanceService_providerId_idx" ON "FreelanceService"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "_DomainProblems_AB_unique" ON "_DomainProblems"("A", "B");

-- CreateIndex
CREATE INDEX "_DomainProblems_B_index" ON "_DomainProblems"("B");

-- AddForeignKey
ALTER TABLE "InterviewBooking" ADD CONSTRAINT "InterviewBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementDrive" ADD CONSTRAINT "PlacementDrive_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "PlacementDrive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelanceService" ADD CONSTRAINT "FreelanceService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DomainProblems" ADD CONSTRAINT "_DomainProblems_A_fkey" FOREIGN KEY ("A") REFERENCES "PracticeDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DomainProblems" ADD CONSTRAINT "_DomainProblems_B_fkey" FOREIGN KEY ("B") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
