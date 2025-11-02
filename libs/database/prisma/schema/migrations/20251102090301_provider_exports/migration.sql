-- CreateEnum
CREATE TYPE "public"."provider_account_status" AS ENUM ('active', 'revoked');

-- CreateEnum
CREATE TYPE "public"."provider_workout_export_status" AS ENUM ('pending', 'success', 'failed', 'skipped');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."connector_provider" ADD VALUE 'SUUNTO';
ALTER TYPE "public"."connector_provider" ADD VALUE 'COROS';

-- CreateTable
CREATE TABLE "public"."provider_account" (
    "provider_account_id" SERIAL NOT NULL,
    "provider" "public"."connector_provider" NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "scopes" TEXT,
    "status" "public"."provider_account_status" NOT NULL DEFAULT 'active',
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_account_pkey" PRIMARY KEY ("provider_account_id")
);

-- CreateTable
CREATE TABLE "public"."provider_workout_export" (
    "provider_workout_export_id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "provider" "public"."connector_provider" NOT NULL,
    "workout_id" INTEGER NOT NULL,
    "planned_date" TIMESTAMP(3) NOT NULL,
    "external_id" TEXT,
    "status" "public"."provider_workout_export_status" NOT NULL DEFAULT 'pending',
    "last_sync_at" TIMESTAMP(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "content_hash" TEXT NOT NULL,
    "error_code" TEXT,
    "error_message" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_workout_export_pkey" PRIMARY KEY ("provider_workout_export_id")
);

-- CreateIndex
CREATE INDEX "provider_account_athlete_id_provider_idx" ON "public"."provider_account"("athlete_id", "provider");

-- CreateIndex
CREATE INDEX "provider_workout_export_status_planned_date_idx" ON "public"."provider_workout_export"("status", "planned_date");

-- CreateIndex
CREATE UNIQUE INDEX "provider_workout_export_athlete_id_provider_workout_id_plan_key" ON "public"."provider_workout_export"("athlete_id", "provider", "workout_id", "planned_date");

-- AddForeignKey
ALTER TABLE "public"."provider_account" ADD CONSTRAINT "provider_account_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_workout_export" ADD CONSTRAINT "provider_workout_export_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_workout_export" ADD CONSTRAINT "provider_workout_export_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workout"("workout_id") ON DELETE RESTRICT ON UPDATE CASCADE;
