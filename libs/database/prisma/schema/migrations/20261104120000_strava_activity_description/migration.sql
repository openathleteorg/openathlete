-- AlterTable
-- Existing accounts keep the feature off: only new Strava connections that
-- grant write access turn it on
ALTER TABLE "provider_account" ADD COLUMN     "activity_description_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "activity_description_language" "user_language";
