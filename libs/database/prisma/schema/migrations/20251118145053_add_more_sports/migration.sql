-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."sport_type" ADD VALUE 'ALPINE_SKI';
ALTER TYPE "public"."sport_type" ADD VALUE 'BACKCOUNTRY_SKI';
ALTER TYPE "public"."sport_type" ADD VALUE 'BADMINTON';
ALTER TYPE "public"."sport_type" ADD VALUE 'CANOEING';
ALTER TYPE "public"."sport_type" ADD VALUE 'E_BIKE_RIDE';
ALTER TYPE "public"."sport_type" ADD VALUE 'ELLIPTICAL';
ALTER TYPE "public"."sport_type" ADD VALUE 'E_MOUNTAIN_BIKE_RIDE';
ALTER TYPE "public"."sport_type" ADD VALUE 'GOLF';
ALTER TYPE "public"."sport_type" ADD VALUE 'GRAVEL_RIDE';
ALTER TYPE "public"."sport_type" ADD VALUE 'HANDCYCLE';
ALTER TYPE "public"."sport_type" ADD VALUE 'HIGH_INTENSITY_INTERVAL_TRAINING';
ALTER TYPE "public"."sport_type" ADD VALUE 'ICE_SKATE';
ALTER TYPE "public"."sport_type" ADD VALUE 'INLINE_SKATE';
ALTER TYPE "public"."sport_type" ADD VALUE 'KAYAKING';
ALTER TYPE "public"."sport_type" ADD VALUE 'KITESURF';
ALTER TYPE "public"."sport_type" ADD VALUE 'MOUNTAIN_BIKE_RIDE';
ALTER TYPE "public"."sport_type" ADD VALUE 'NORDIC_SKI';
ALTER TYPE "public"."sport_type" ADD VALUE 'PICKLEBALL';
ALTER TYPE "public"."sport_type" ADD VALUE 'PILATES';
ALTER TYPE "public"."sport_type" ADD VALUE 'RACQUETBALL';
ALTER TYPE "public"."sport_type" ADD VALUE 'ROLLER_SKI';
ALTER TYPE "public"."sport_type" ADD VALUE 'ROWING';
ALTER TYPE "public"."sport_type" ADD VALUE 'SAIL';
ALTER TYPE "public"."sport_type" ADD VALUE 'SKATEBOARD';
ALTER TYPE "public"."sport_type" ADD VALUE 'SNOWBOARD';
ALTER TYPE "public"."sport_type" ADD VALUE 'SNOWSHOE';
ALTER TYPE "public"."sport_type" ADD VALUE 'SOCCER';
ALTER TYPE "public"."sport_type" ADD VALUE 'SQUASH';
ALTER TYPE "public"."sport_type" ADD VALUE 'STAIR_STEPPER';
ALTER TYPE "public"."sport_type" ADD VALUE 'STAND_UP_PADDLING';
ALTER TYPE "public"."sport_type" ADD VALUE 'SURFING';
ALTER TYPE "public"."sport_type" ADD VALUE 'TABLE_TENNIS';
ALTER TYPE "public"."sport_type" ADD VALUE 'TENNIS';
ALTER TYPE "public"."sport_type" ADD VALUE 'VELOMOBILE';
ALTER TYPE "public"."sport_type" ADD VALUE 'VIRTUAL_RIDE';
ALTER TYPE "public"."sport_type" ADD VALUE 'VIRTUAL_ROW';
ALTER TYPE "public"."sport_type" ADD VALUE 'VIRTUAL_RUN';
ALTER TYPE "public"."sport_type" ADD VALUE 'WALK';
ALTER TYPE "public"."sport_type" ADD VALUE 'WEIGHT_TRAINING';
ALTER TYPE "public"."sport_type" ADD VALUE 'WHEELCHAIR';
ALTER TYPE "public"."sport_type" ADD VALUE 'WINDSURF';
ALTER TYPE "public"."sport_type" ADD VALUE 'WORKOUT';
