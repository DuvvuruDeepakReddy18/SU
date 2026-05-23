-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "failedTest" JSONB,
ADD COLUMN     "testsPassed" INTEGER,
ADD COLUMN     "testsTotal" INTEGER;
