-- Efficiency of a run: metres per joule on its flat stretches and the
-- efficiency factor of its power. Computed with the intensity figures, so
-- INTENSITY_VERSION fills them in the background
ALTER TABLE "public"."event_activity"
  ADD COLUMN "flat_speed_per_watt" DOUBLE PRECISION,
  ADD COLUMN "power_efficiency_factor" DOUBLE PRECISION;
