-- Undoing a session planned for a group looks up its batch. Built
-- concurrently so live writes are not blocked; it must stay the only
-- statement of this migration, as CONCURRENTLY cannot run in a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "event_batch_id_idx" ON "event"("batch_id");
