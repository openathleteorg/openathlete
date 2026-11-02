-- CreateIndex
CREATE INDEX CONCURRENTLY "agent_message_parent_message_id_idx" ON "agent_message"("parent_message_id");
