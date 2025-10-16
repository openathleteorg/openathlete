-- CreateEnum
CREATE TYPE "public"."plan_status" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."cycle_phase" AS ENUM ('BASE', 'SPECIFIC', 'TAPER', 'RECOVERY', 'COMPETITION');

-- CreateEnum
CREATE TYPE "public"."availability_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "public"."cycle" ADD COLUMN     "phase" "public"."cycle_phase",
ADD COLUMN     "training_plan_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."event" ADD COLUMN     "training_week_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."training_plan" (
    "training_plan_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."plan_status" NOT NULL DEFAULT 'DRAFT',
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plan_pkey" PRIMARY KEY ("training_plan_id")
);

-- CreateTable
CREATE TABLE "public"."training_week" (
    "training_week_id" SERIAL NOT NULL,
    "week_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "theme" TEXT,
    "target_volume" INTEGER,
    "target_load" DOUBLE PRECISION,
    "cycle_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_week_pkey" PRIMARY KEY ("training_week_id")
);

-- CreateTable
CREATE TABLE "public"."athlete_availability" (
    "athlete_availability_id" SERIAL NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "priority" "public"."availability_priority" NOT NULL DEFAULT 'MEDIUM',
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_availability_pkey" PRIMARY KEY ("athlete_availability_id")
);

-- CreateIndex
CREATE INDEX "training_plan_athlete_id_status_idx" ON "public"."training_plan"("athlete_id", "status");

-- CreateIndex
CREATE INDEX "training_week_cycle_id_week_number_idx" ON "public"."training_week"("cycle_id", "week_number");

-- CreateIndex
CREATE INDEX "athlete_availability_athlete_id_day_of_week_idx" ON "public"."athlete_availability"("athlete_id", "day_of_week");

-- CreateIndex
CREATE INDEX "cycle_training_plan_id_idx" ON "public"."cycle"("training_plan_id");

-- CreateIndex
CREATE INDEX "event_training_week_id_idx" ON "public"."event"("training_week_id");

-- AddForeignKey
ALTER TABLE "public"."event" ADD CONSTRAINT "event_training_week_id_fkey" FOREIGN KEY ("training_week_id") REFERENCES "public"."training_week"("training_week_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cycle" ADD CONSTRAINT "cycle_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "public"."training_plan"("training_plan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_plan" ADD CONSTRAINT "training_plan_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_week" ADD CONSTRAINT "training_week_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."cycle"("cycle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."athlete_availability" ADD CONSTRAINT "athlete_availability_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;
