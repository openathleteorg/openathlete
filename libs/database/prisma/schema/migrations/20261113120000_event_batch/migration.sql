-- Sessions planned for several athletes at once share a batch id, to undo
-- them together. Nullable without a default: adding it does not rewrite the
-- table.
ALTER TABLE "event" ADD COLUMN "batch_id" TEXT;
