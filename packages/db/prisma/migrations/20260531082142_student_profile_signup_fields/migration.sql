-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "cgpaVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "collegeIdOcrExtracted" JSONB,
ADD COLUMN     "collegeIdRejectionReason" TEXT,
ADD COLUMN     "collegeIdStatus" TEXT,
ADD COLUMN     "courseProgram" TEXT,
ADD COLUMN     "governmentName" TEXT,
ADD COLUMN     "instituteEmail" TEXT,
ADD COLUMN     "phoneNumber" TEXT;
