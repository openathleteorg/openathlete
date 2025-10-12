-- CreateEnum
CREATE TYPE "public"."metric_type" AS ENUM ('WEIGHT', 'HEIGHT', 'BMI', 'BODY_FAT', 'MUSCLE_MASS', 'DAILY_CALORIES', 'DAILY_STEPS', 'SLEEP_DURATION', 'SLEEP_SCORE', 'HOOPER_INDEX', 'HR_MAX', 'HR_REST', 'HR_RESERVE', 'RMSSD', 'VMA', 'CRITICAL_POWER_RUNNING', 'CRITICAL_POWER_CYCLING', 'VO2MAX', 'FTP_RUNNING', 'FTP_CYCLING', 'VERTICAL_SPEED_AVG', 'VERTICAL_SPEED_MAX', 'FITNESS_INDEX');

-- CreateTable
CREATE TABLE "public"."athlete_metric" (
    "athlete_metric_id" SERIAL NOT NULL,
    "type" "public"."metric_type" NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_metric_pkey" PRIMARY KEY ("athlete_metric_id")
);

-- CreateIndex
CREATE INDEX "athlete_metric_athlete_id_type_idx" ON "public"."athlete_metric"("athlete_id", "type");

-- CreateIndex
CREATE INDEX "athlete_metric_athlete_id_date_idx" ON "public"."athlete_metric"("athlete_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_metric_athlete_id_type_date_key" ON "public"."athlete_metric"("athlete_id", "type", "date");

-- AddForeignKey
ALTER TABLE "public"."athlete_metric" ADD CONSTRAINT "athlete_metric_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;
