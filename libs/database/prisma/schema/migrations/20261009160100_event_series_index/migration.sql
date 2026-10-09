-- Editing "this and the following" occurrences looks up a series. Built
-- concurrently so live writes are not blocked; it must stay the only
-- statement of this migration, as CONCURRENTLY cannot run in a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "event_series_id_idx" ON "event"("series_id");
