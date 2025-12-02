-- AlterTable
ALTER TABLE "public"."athlete_injury" ADD COLUMN     "source_activity_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."activity_feedback_embedding" (
    "activity_feedback_embedding_id" SERIAL NOT NULL,
    "text_content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "event_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_feedback_embedding_pkey" PRIMARY KEY ("activity_feedback_embedding_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_feedback_embedding_event_activity_id_key" ON "public"."activity_feedback_embedding"("event_activity_id");

-- CreateIndex
CREATE INDEX "athlete_injury_source_activity_id_idx" ON "public"."athlete_injury"("source_activity_id");

-- AddForeignKey
ALTER TABLE "public"."athlete_injury" ADD CONSTRAINT "athlete_injury_source_activity_id_fkey" FOREIGN KEY ("source_activity_id") REFERENCES "public"."event_activity"("event_activity_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_feedback_embedding" ADD CONSTRAINT "activity_feedback_embedding_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "public"."event_activity"("event_activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;
