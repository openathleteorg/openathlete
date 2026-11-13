-- CreateEnum
CREATE TYPE "training_goal" AS ENUM ('RACE', 'PROGRESS', 'RESTART', 'FOLLOW_COACH');

-- CreateEnum
CREATE TYPE "weekly_training_hours" AS ENUM ('UNDER_3', 'FROM_3_TO_6', 'FROM_6_TO_10', 'OVER_10');

-- CreateEnum
CREATE TYPE "coach_team_size" AS ENUM ('STARTING', 'FROM_1_TO_5', 'FROM_6_TO_20', 'OVER_20');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "practiced_sports" "sport_type"[] DEFAULT ARRAY[]::"sport_type"[],
ADD COLUMN "training_goal" "training_goal",
ADD COLUMN "weekly_training_hours" "weekly_training_hours",
ADD COLUMN "coach_team_size" "coach_team_size";
