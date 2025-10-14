-- CreateEnum
CREATE TYPE "public"."workout_step_type" AS ENUM ('WARMUP', 'COOLDOWN', 'INTERVAL_ACTIVE', 'INTERVAL_REST', 'STEADY', 'REPEAT', 'FREE');

-- CreateEnum
CREATE TYPE "public"."workout_duration_type" AS ENUM ('TIME', 'DISTANCE', 'CALORIES', 'HR_BELOW', 'HR_ABOVE', 'LAP_BUTTON', 'OPEN');

-- CreateEnum
CREATE TYPE "public"."workout_target_type" AS ENUM ('OPEN', 'PACE', 'SPEED', 'HEARTRATE', 'POWER', 'CADENCE', 'RPE');

-- CreateEnum
CREATE TYPE "public"."workout_target_unit" AS ENUM ('MIN_PER_KM', 'M_PER_S', 'KM_PER_H', 'BPM', 'PERCENT_MAX_HR', 'WATTS', 'PERCENT_FTP', 'RPM', 'SPM', 'RPE_SCALE');

-- CreateTable
CREATE TABLE "public"."workout" (
    "workout_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "sport" "public"."sport_type" NOT NULL,
    "estimated_duration" INTEGER,
    "total_distance" DOUBLE PRECISION,
    "event_training_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_pkey" PRIMARY KEY ("workout_id")
);

-- CreateTable
CREATE TABLE "public"."workout_step" (
    "workout_step_id" SERIAL NOT NULL,
    "order_index" INTEGER NOT NULL,
    "step_type" "public"."workout_step_type" NOT NULL,
    "name" TEXT,
    "notes" TEXT DEFAULT '',
    "duration_type" "public"."workout_duration_type" NOT NULL,
    "duration_value" DOUBLE PRECISION,
    "duration_target" DOUBLE PRECISION,
    "workout_id" INTEGER,
    "repeat_parent_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_step_pkey" PRIMARY KEY ("workout_step_id")
);

-- CreateTable
CREATE TABLE "public"."workout_repeat" (
    "workout_repeat_id" SERIAL NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "step_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_repeat_pkey" PRIMARY KEY ("workout_repeat_id")
);

-- CreateTable
CREATE TABLE "public"."workout_step_target" (
    "workout_step_target_id" SERIAL NOT NULL,
    "target_type" "public"."workout_target_type" NOT NULL,
    "target_zone" INTEGER,
    "target_min" DOUBLE PRECISION,
    "target_max" DOUBLE PRECISION,
    "target_value" DOUBLE PRECISION,
    "unit" "public"."workout_target_unit",
    "step_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_step_target_pkey" PRIMARY KEY ("workout_step_target_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workout_event_training_id_key" ON "public"."workout"("event_training_id");

-- CreateIndex
CREATE INDEX "workout_step_workout_id_order_index_idx" ON "public"."workout_step"("workout_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "workout_repeat_step_id_key" ON "public"."workout_repeat"("step_id");

-- CreateIndex
CREATE INDEX "workout_step_target_step_id_idx" ON "public"."workout_step_target"("step_id");

-- AddForeignKey
ALTER TABLE "public"."workout" ADD CONSTRAINT "workout_event_training_id_fkey" FOREIGN KEY ("event_training_id") REFERENCES "public"."event_training"("event_training_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_step" ADD CONSTRAINT "workout_step_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workout"("workout_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_step" ADD CONSTRAINT "workout_step_repeat_parent_id_fkey" FOREIGN KEY ("repeat_parent_id") REFERENCES "public"."workout_repeat"("workout_repeat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_repeat" ADD CONSTRAINT "workout_repeat_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."workout_step"("workout_step_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_step_target" ADD CONSTRAINT "workout_step_target_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."workout_step"("workout_step_id") ON DELETE CASCADE ON UPDATE CASCADE;
