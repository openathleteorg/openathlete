/*
  Warnings:

  - A unique constraint covering the columns `[external_id]` on the table `event_activity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "event_activity_external_id_key" ON "public"."event_activity"("external_id");
