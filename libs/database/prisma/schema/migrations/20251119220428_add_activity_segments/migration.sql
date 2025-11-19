-- CreateEnum
CREATE TYPE "public"."activity_segment_type" AS ENUM ('LAP', 'WORKOUT_STEP', 'MANUAL', 'AUTO_SPLIT');

-- CreateTable
CREATE TABLE "public"."activity_segment" (
    "activity_segment_id" SERIAL NOT NULL,
    "segment_type" "public"."activity_segment_type" NOT NULL,
    "name" TEXT,
    "order_index" INTEGER NOT NULL,
    "start_time_seconds" INTEGER NOT NULL,
    "end_time_seconds" INTEGER NOT NULL,
    "distance" DOUBLE PRECISION,
    "elevation_gain" DOUBLE PRECISION,
    "moving_time" INTEGER,
    "average_speed" DOUBLE PRECISION,
    "max_speed" DOUBLE PRECISION,
    "average_cadence" DOUBLE PRECISION,
    "average_watts" DOUBLE PRECISION,
    "max_watts" DOUBLE PRECISION,
    "weighted_average_watts" DOUBLE PRECISION,
    "average_heartrate" DOUBLE PRECISION,
    "max_heartrate" DOUBLE PRECISION,
    "kilojoules" DOUBLE PRECISION,
    "average_gap_speed" DOUBLE PRECISION,
    "average_normalized_speed" DOUBLE PRECISION,
    "event_activity_id" INTEGER NOT NULL,
    "workout_step_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_segment_pkey" PRIMARY KEY ("activity_segment_id")
);

-- CreateIndex
CREATE INDEX "activity_segment_event_activity_id_order_index_idx" ON "public"."activity_segment"("event_activity_id", "order_index");

-- CreateIndex
CREATE INDEX "activity_segment_workout_step_id_idx" ON "public"."activity_segment"("workout_step_id");

-- AddForeignKey
ALTER TABLE "public"."activity_segment" ADD CONSTRAINT "activity_segment_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "public"."event_activity"("event_activity_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_segment" ADD CONSTRAINT "activity_segment_workout_step_id_fkey" FOREIGN KEY ("workout_step_id") REFERENCES "public"."workout_step"("workout_step_id") ON DELETE SET NULL ON UPDATE CASCADE;
