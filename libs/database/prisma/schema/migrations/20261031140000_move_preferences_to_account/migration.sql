-- AlterTable
ALTER TABLE "athlete_settings" ADD COLUMN     "dismissed_record_suspects" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "hidden_activity_tracks" JSONB,
ADD COLUMN     "support_reminder_dismissed_at" TIMESTAMP(3);
