-- CreateEnum
CREATE TYPE "public"."user_language" AS ENUM ('FR', 'EN');

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "language" "public"."user_language" NOT NULL DEFAULT 'FR';
