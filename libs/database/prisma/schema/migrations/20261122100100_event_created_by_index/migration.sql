-- Events are looked up by author, and the foreign key is cleared when a user
-- is deleted. Built concurrently so live writes are not blocked; it must stay
-- the only statement of this migration, as CONCURRENTLY cannot run in a
-- transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "event_created_by_id_idx" ON "event"("created_by_id");
