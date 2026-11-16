-- Garmin requires its data to be attributed ("Garmin Forerunner 965")
-- wherever it is shown: activities keep the model of the device that
-- recorded them, metrics the provider they came from. Both nullable: no
-- rewrite of the tables.

-- AlterTable
ALTER TABLE "event_activity" ADD COLUMN "device_name" TEXT;

-- AlterTable
ALTER TABLE "athlete_metric" ADD COLUMN "source" "connector_provider";

-- Backfill what can only have come from Garmin: values a watch measures
-- (sleep, stress, Body Battery, steps...) of athletes whose only health
-- provider is Garmin. Values one also enters by hand (weight, resting heart
-- rate, VO2max, blood pressure) stay unattributed: a wrong "Garmin" label
-- would be worse than none, and the next sync labels them.
UPDATE "athlete_metric" AS m
SET "source" = 'GARMIN'
WHERE m."notes" IS NULL
  AND m."type" IN (
    'BODY_BATTERY_CHARGED', 'BODY_BATTERY_DRAINED',
    'DAILY_ACTIVE_CALORIES', 'DAILY_ACTIVE_MINUTES', 'DAILY_BMR_CALORIES',
    'DAILY_CALORIES', 'DAILY_DISTANCE', 'DAILY_FLOORS',
    'DAILY_MODERATE_MINUTES', 'DAILY_STEPS', 'DAILY_VIGOROUS_MINUTES',
    'FITNESS_AGE', 'HRV_LAST_NIGHT_5MIN_HIGH', 'HRV_LAST_NIGHT_AVG',
    'HR_AVG_DAILY', 'HR_MAX_DAILY', 'HR_MIN_DAILY', 'NAP_DURATION',
    'PULSE_OX_AVG', 'PULSE_OX_MIN', 'RESPIRATION_RATE_AVG',
    'SKIN_TEMP_DEVIATION', 'SLEEP_AWAKE_DURATION', 'SLEEP_DEEP_DURATION',
    'SLEEP_DURATION', 'SLEEP_LIGHT_DURATION', 'SLEEP_REM_DURATION',
    'SLEEP_RESPIRATION_AVG', 'SLEEP_SCORE', 'SLEEP_SPO2_AVG',
    'SNAPSHOT_HEART_RATE_AVG', 'SNAPSHOT_RESPIRATION_AVG', 'SNAPSHOT_RMSSD',
    'SNAPSHOT_SDNN', 'SNAPSHOT_SPO2_AVG', 'SNAPSHOT_STRESS_AVG',
    'STRESS_ACTIVITY_DURATION', 'STRESS_AVERAGE', 'STRESS_DURATION',
    'STRESS_HIGH_DURATION', 'STRESS_LOW_DURATION', 'STRESS_MAX',
    'STRESS_MEDIUM_DURATION', 'STRESS_REST_DURATION'
  )
  AND EXISTS (
    SELECT 1 FROM "provider_account" p
    WHERE p."athlete_id" = m."athlete_id" AND p."provider" = 'GARMIN'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "provider_account" p
    WHERE p."athlete_id" = m."athlete_id"
      AND p."provider" IN ('SUUNTO', 'POLAR', 'COROS', 'FITBIT', 'APPLE_HEALTH')
  );
