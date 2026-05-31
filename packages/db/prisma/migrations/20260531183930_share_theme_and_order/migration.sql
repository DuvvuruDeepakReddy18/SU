-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "shareSectionsOrder" TEXT[] DEFAULT ARRAY['about', 'skills', 'projects', 'certifications']::TEXT[],
ADD COLUMN     "shareTheme" TEXT NOT NULL DEFAULT 'default';
