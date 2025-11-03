/*
  Warnings:

  - The values [SPEED,REPS_TARGET] on the enum `workout_target_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `target_zone` on the `workout_step_target` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."workout_target_type_new" AS ENUM ('OPEN', 'PACE', 'HEARTRATE', 'POWER', 'CADENCE', 'RPE', 'WEIGHT', 'ZONE');
ALTER TABLE "public"."workout_step_target" ALTER COLUMN "target_type" TYPE "public"."workout_target_type_new" USING ("target_type"::text::"public"."workout_target_type_new");
ALTER TYPE "public"."workout_target_type" RENAME TO "workout_target_type_old";
ALTER TYPE "public"."workout_target_type_new" RENAME TO "workout_target_type";
DROP TYPE "public"."workout_target_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."workout_step_target" DROP COLUMN "target_zone";
