-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "addedByUserId" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "nirfRank" INTEGER,
ADD COLUMN     "shortName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "domain" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Institution_category_idx" ON "Institution"("category");

-- CreateIndex
CREATE INDEX "Institution_nirfRank_idx" ON "Institution"("nirfRank");

-- CreateIndex
CREATE INDEX "Institution_name_idx" ON "Institution"("name");
