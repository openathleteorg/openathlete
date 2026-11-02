-- CreateIndex
CREATE INDEX CONCURRENTLY "workout_step_repeat_parent_id_idx" ON "workout_step"("repeat_parent_id");
