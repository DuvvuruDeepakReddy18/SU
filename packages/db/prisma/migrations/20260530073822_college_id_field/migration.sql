-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "collegeIdUploadedAt" TIMESTAMP(3),
ADD COLUMN     "collegeIdUrl" TEXT,
ADD COLUMN     "collegeIdVerifiedAt" TIMESTAMP(3);
