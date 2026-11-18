-- When the user first opened a year review (nullable: nothing to backfill)
ALTER TABLE "user" ADD COLUMN "year_review_seen_at" TIMESTAMP(3);
