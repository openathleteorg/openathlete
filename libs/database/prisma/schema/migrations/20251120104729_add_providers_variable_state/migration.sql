-- AlterTable
ALTER TABLE "public"."provider_account" ADD COLUMN     "export_workouts_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "full_import_completed_at" TIMESTAMP(3),
ADD COLUMN     "full_import_requested_at" TIMESTAMP(3),
ADD COLUMN     "import_activities_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "import_metrics_enabled" BOOLEAN NOT NULL DEFAULT false;
