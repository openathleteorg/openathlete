-- AlterEnum
ALTER TYPE "public"."workout_duration_type" ADD VALUE 'REPS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."workout_target_type" ADD VALUE 'WEIGHT';
ALTER TYPE "public"."workout_target_type" ADD VALUE 'REPS_TARGET';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."workout_target_unit" ADD VALUE 'KG';
ALTER TYPE "public"."workout_target_unit" ADD VALUE 'LBS';
ALTER TYPE "public"."workout_target_unit" ADD VALUE 'REPS';

-- AlterTable
ALTER TABLE "public"."workout_step" ADD COLUMN     "exercise_name" TEXT;
