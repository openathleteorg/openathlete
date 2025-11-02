/*
  Warnings:

  - You are about to drop the `connector` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."connector" DROP CONSTRAINT "connector_athlete_id_fkey";

-- DropTable
DROP TABLE "public"."connector";
