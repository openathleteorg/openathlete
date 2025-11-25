/*
  Warnings:

  - You are about to drop the column `estimated_duration` on the `workout` table. All the data in the column will be lost.
  - You are about to drop the column `total_distance` on the `workout` table. All the data in the column will be lost.
  - You are about to drop the column `exercise_name` on the `workout_step` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `workout_step_target` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."workout" DROP COLUMN "estimated_duration",
DROP COLUMN "total_distance";

-- AlterTable
ALTER TABLE "public"."workout_step" DROP COLUMN "exercise_name";

-- AlterTable
ALTER TABLE "public"."workout_step_target" DROP COLUMN "unit",
ADD COLUMN     "metric_type" "public"."metric_type";

-- DropEnum
DROP TYPE "public"."workout_target_unit";
