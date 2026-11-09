-- AlterTable
ALTER TABLE "user" ADD COLUMN "support_reminder_dismiss_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "supporter_nudge_seen_at" TIMESTAMP(3);

-- Those who already dismissed the request did so once
UPDATE "user" SET "support_reminder_dismiss_count" = 1
WHERE "support_reminder_dismissed_at" IS NOT NULL;
