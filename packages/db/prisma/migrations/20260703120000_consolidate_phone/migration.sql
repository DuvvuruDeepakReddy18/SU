-- Consolidate the duplicate phone columns. `phoneNumber` is the column the
-- recruiter contact reveal + resume builder actually read; `phone` was a stray
-- column the profile settings page wrote to, so those edits never reached
-- recruiters. Copy any phone-only values into phoneNumber first (without
-- clobbering an existing number), THEN drop the dead column, so no numbers are
-- lost. Order matters: the UPDATE runs before the DROP.
UPDATE "StudentProfile"
SET "phoneNumber" = "phone"
WHERE "phoneNumber" IS NULL AND "phone" IS NOT NULL AND "phone" <> '';

-- DropColumn
ALTER TABLE "StudentProfile" DROP COLUMN "phone";
