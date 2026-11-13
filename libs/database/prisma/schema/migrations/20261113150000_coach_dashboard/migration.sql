-- Thresholds coaches watch on their athletes' metrics, and how each coach
-- set up their dashboard. A nullable column and a new table: no rewrite.

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "coach_dashboard" JSONB;

-- CreateTable
CREATE TABLE "coach_metric_threshold" (
    "metric_threshold_id" SERIAL NOT NULL,
    "metric_type" "metric_type" NOT NULL,
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coach_user_id" INTEGER NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_metric_threshold_pkey" PRIMARY KEY ("metric_threshold_id")
);

-- CreateIndex
CREATE INDEX "coach_metric_threshold_athlete_id_idx" ON "coach_metric_threshold"("athlete_id");

-- CreateIndex
CREATE UNIQUE INDEX "coach_metric_threshold_coach_user_id_athlete_id_metric_type_key" ON "coach_metric_threshold"("coach_user_id", "athlete_id", "metric_type");

-- AddForeignKey
ALTER TABLE "coach_metric_threshold" ADD CONSTRAINT "coach_metric_threshold_coach_user_id_fkey" FOREIGN KEY ("coach_user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_metric_threshold" ADD CONSTRAINT "coach_metric_threshold_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;
