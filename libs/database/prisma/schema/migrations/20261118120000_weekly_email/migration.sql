-- AlterEnum
ALTER TYPE "lifecycle_email_kind" ADD VALUE 'WEEKLY_RECAP';
ALTER TYPE "lifecycle_email_kind" ADD VALUE 'COACH_WEEKLY';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "email_weekly" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email_coach_weekly" BOOLEAN NOT NULL DEFAULT true;
