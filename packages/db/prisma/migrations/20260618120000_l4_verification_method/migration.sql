-- CreateEnum
CREATE TYPE "L4VerificationMethod" AS ENUM ('AI_VERIFIED', 'EXPERT_VERIFIED');

-- AlterTable
ALTER TABLE "UserSkill" ADD COLUMN     "l4VerificationMethod" "L4VerificationMethod";
