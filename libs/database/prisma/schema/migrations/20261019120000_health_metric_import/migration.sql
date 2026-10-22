-- Apple Health SDNN must remain distinct from RMSSD and Garmin overnight HRV.
ALTER TYPE "metric_type" ADD VALUE 'HRV_SDNN';
ALTER TABLE "athlete_metric"
  ADD COLUMN "source" TEXT,
  ADD COLUMN "source_metadata" JSONB;
