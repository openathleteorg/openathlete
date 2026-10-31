-- CreateTable
CREATE TABLE "record_exclusion" (
    "record_exclusion_id" SERIAL NOT NULL,
    "type" "record_type",
    "distance" DOUBLE PRECISION,
    "duration" INTEGER,
    "event_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_exclusion_pkey" PRIMARY KEY ("record_exclusion_id")
);

-- CreateIndex
CREATE INDEX "record_exclusion_event_activity_id_idx" ON "record_exclusion"("event_activity_id");

-- AddForeignKey
ALTER TABLE "record_exclusion" ADD CONSTRAINT "record_exclusion_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "event_activity"("event_activity_id") ON DELETE CASCADE ON UPDATE CASCADE;
