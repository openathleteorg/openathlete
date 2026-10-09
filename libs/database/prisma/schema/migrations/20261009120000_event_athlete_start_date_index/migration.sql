-- Calendar, training load and statistics read one athlete's events over a
-- date range: without this index each read scans the whole event table.
-- Built concurrently so live writes are not blocked. It must stay the only
-- statement of this migration, as CONCURRENTLY cannot run in a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "event_athlete_id_start_date_idx" ON "event"("athlete_id", "start_date");
