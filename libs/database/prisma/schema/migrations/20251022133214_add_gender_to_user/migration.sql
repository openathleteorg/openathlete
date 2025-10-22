-- CreateEnum
CREATE TYPE "public"."gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "gender" "public"."gender";
