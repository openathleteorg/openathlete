-- Occurrences of a repeated session share a series id. Nullable without a
-- default: adding it does not rewrite the table.
ALTER TABLE "event" ADD COLUMN "series_id" TEXT;
