-- A club session's occurrences are looked up by session. Built
-- concurrently so live writes are not blocked; it must stay the only
-- statement of this migration, as CONCURRENTLY cannot run in a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "event_club_session_id_idx" ON "event"("club_session_id");
