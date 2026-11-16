-- Efficiency of a run, from the athlete's WKO5 chart: computed with the
-- intensity figures, so INTENSITY_VERSION fills them in the background
ALTER TABLE "public"."event_activity"
  ADD COLUMN "biomechanical_efficiency" DOUBLE PRECISION,
  ADD COLUMN "metabolic_efficiency" DOUBLE PRECISION,
  ADD COLUMN "total_efficiency" DOUBLE PRECISION;
