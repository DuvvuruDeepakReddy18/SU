-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "correctOption" INTEGER,
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'code',
ADD COLUMN     "options" TEXT[];
