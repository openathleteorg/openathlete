-- CreateIndex
CREATE INDEX CONCURRENTLY "agent_message_thread_id_idx" ON "agent_message"("thread_id");
