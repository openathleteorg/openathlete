/*
  Warnings:

  - You are about to drop the column `description` on the `workout` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `workout` table. All the data in the column will be lost.
  - You are about to drop the column `sport` on the `workout` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."workout" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "sport";
