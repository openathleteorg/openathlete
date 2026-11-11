-- CreateEnum
CREATE TYPE "acquisition_source" AS ENUM ('REDDIT', 'GOOGLE', 'AI_ASSISTANT', 'COACH_OR_FRIEND', 'DISCORD', 'YOUTUBE', 'OTHER');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "acquisition_source" "acquisition_source";
