-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."metric_type" ADD VALUE 'BONE_MASS';
ALTER TYPE "public"."metric_type" ADD VALUE 'BODY_WATER';
ALTER TYPE "public"."metric_type" ADD VALUE 'DAILY_ACTIVE_CALORIES';
ALTER TYPE "public"."metric_type" ADD VALUE 'DAILY_BMR_CALORIES';
ALTER TYPE "public"."metric_type" ADD VALUE 'DAILY_DISTANCE';
ALTER TYPE "public"."metric_type" ADD VALUE 'DAILY_ACTIVE_MINUTES';
ALTER TYPE "public"."metric_type" ADD VALUE 'DAILY_MODERATE_MINUTES';
ALTER TYPE "public"."metric_type" ADD VALUE 'DAILY_VIGOROUS_MINUTES';
ALTER TYPE "public"."metric_type" ADD VALUE 'DAILY_FLOORS';
ALTER TYPE "public"."metric_type" ADD VALUE 'SLEEP_REM_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'SLEEP_DEEP_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'SLEEP_LIGHT_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'SLEEP_AWAKE_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'SLEEP_RESPIRATION_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'SLEEP_SPO2_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'NAP_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'HR_MIN_DAILY';
ALTER TYPE "public"."metric_type" ADD VALUE 'HR_AVG_DAILY';
ALTER TYPE "public"."metric_type" ADD VALUE 'HR_MAX_DAILY';
ALTER TYPE "public"."metric_type" ADD VALUE 'HRV_LAST_NIGHT_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'HRV_LAST_NIGHT_5MIN_HIGH';
ALTER TYPE "public"."metric_type" ADD VALUE 'SNAPSHOT_HEART_RATE_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'SNAPSHOT_STRESS_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'SNAPSHOT_RESPIRATION_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'SNAPSHOT_SPO2_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'SNAPSHOT_SDNN';
ALTER TYPE "public"."metric_type" ADD VALUE 'SNAPSHOT_RMSSD';
ALTER TYPE "public"."metric_type" ADD VALUE 'RESPIRATION_RATE_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'PULSE_OX_AVG';
ALTER TYPE "public"."metric_type" ADD VALUE 'PULSE_OX_MIN';
ALTER TYPE "public"."metric_type" ADD VALUE 'BLOOD_PRESSURE_SYSTOLIC';
ALTER TYPE "public"."metric_type" ADD VALUE 'BLOOD_PRESSURE_DIASTOLIC';
ALTER TYPE "public"."metric_type" ADD VALUE 'BLOOD_PRESSURE_PULSE';
ALTER TYPE "public"."metric_type" ADD VALUE 'STRESS_AVERAGE';
ALTER TYPE "public"."metric_type" ADD VALUE 'STRESS_MAX';
ALTER TYPE "public"."metric_type" ADD VALUE 'STRESS_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'STRESS_REST_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'STRESS_ACTIVITY_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'STRESS_LOW_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'STRESS_MEDIUM_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'STRESS_HIGH_DURATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'BODY_BATTERY_CHARGED';
ALTER TYPE "public"."metric_type" ADD VALUE 'BODY_BATTERY_DRAINED';
ALTER TYPE "public"."metric_type" ADD VALUE 'SKIN_TEMP_DEVIATION';
ALTER TYPE "public"."metric_type" ADD VALUE 'VO2MAX_CYCLING';
ALTER TYPE "public"."metric_type" ADD VALUE 'FITNESS_AGE';
