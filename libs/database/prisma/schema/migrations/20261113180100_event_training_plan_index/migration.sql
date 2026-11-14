-- Moving or removing an applied training plan reads its sessions by plan.
-- Built concurrently so live writes are not blocked. It must stay the only
-- statement of this migration, as CONCURRENTLY cannot run in a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "event_training_plan_id_idx" ON "event"("training_plan_id");
