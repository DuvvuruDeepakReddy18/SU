-- CreateTable
CREATE TABLE "InstitutionKnowledge" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionKnowledge_institutionId_idx" ON "InstitutionKnowledge"("institutionId");

-- AddForeignKey
ALTER TABLE "InstitutionKnowledge" ADD CONSTRAINT "InstitutionKnowledge_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
