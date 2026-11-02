ALTER TABLE "garmin_personal_connection" ADD COLUMN "queued_at" TIMESTAMP(3);
ALTER TABLE "garmin_personal_item" ADD COLUMN "skip_reason" TEXT;
CREATE INDEX "garmin_personal_item_event_activity_id_idx" ON "garmin_personal_item"("event_activity_id");
