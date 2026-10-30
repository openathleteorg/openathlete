-- AlterTable
ALTER TABLE "event_activity" ADD COLUMN     "decoupling_percent" DOUBLE PRECISION,
ADD COLUMN     "efficiency_factor" DOUBLE PRECISION,
ADD COLUMN     "intensity_seconds" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
ADD COLUMN     "intensity_version" INTEGER NOT NULL DEFAULT 0;
