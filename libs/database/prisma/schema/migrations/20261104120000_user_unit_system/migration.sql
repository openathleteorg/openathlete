-- CreateEnum
CREATE TYPE "unit_system" AS ENUM ('METRIC', 'IMPERIAL');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "unit_system" "unit_system" NOT NULL DEFAULT 'METRIC',
ADD COLUMN     "unit_system_chosen_at" TIMESTAMP(3);
