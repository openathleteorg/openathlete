/*
  Warnings:

  - You are about to drop the column `event_training_id` on the `message_thread` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[event_activity_id]` on the table `message_thread` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."message_thread" DROP CONSTRAINT "message_thread_event_training_id_fkey";

-- DropIndex
DROP INDEX "public"."message_thread_event_training_id_idx";

-- DropIndex
DROP INDEX "public"."message_thread_event_training_id_key";

-- AlterTable
ALTER TABLE "public"."event_training" ADD COLUMN     "message_threadMessage_thread_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."message_thread" DROP COLUMN "event_training_id",
ADD COLUMN     "event_activity_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "message_thread_event_activity_id_key" ON "public"."message_thread"("event_activity_id");

-- CreateIndex
CREATE INDEX "message_thread_event_activity_id_idx" ON "public"."message_thread"("event_activity_id");

-- AddForeignKey
ALTER TABLE "public"."event_training" ADD CONSTRAINT "event_training_message_threadMessage_thread_id_fkey" FOREIGN KEY ("message_threadMessage_thread_id") REFERENCES "public"."message_thread"("message_thread_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_thread" ADD CONSTRAINT "message_thread_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "public"."event_activity"("event_activity_id") ON DELETE CASCADE ON UPDATE CASCADE;
