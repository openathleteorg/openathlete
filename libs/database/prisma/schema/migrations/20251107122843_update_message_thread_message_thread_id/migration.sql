/*
  Warnings:

  - You are about to drop the column `message_threadMessage_thread_id` on the `event_training` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[message_thread_message_thread_id]` on the table `event_training` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."event_training" DROP CONSTRAINT "event_training_message_threadMessage_thread_id_fkey";

-- AlterTable
ALTER TABLE "public"."event_training" DROP COLUMN "message_threadMessage_thread_id",
ADD COLUMN     "message_thread_message_thread_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "event_training_message_thread_message_thread_id_key" ON "public"."event_training"("message_thread_message_thread_id");

-- AddForeignKey
ALTER TABLE "public"."event_training" ADD CONSTRAINT "event_training_message_thread_message_thread_id_fkey" FOREIGN KEY ("message_thread_message_thread_id") REFERENCES "public"."message_thread"("message_thread_id") ON DELETE SET NULL ON UPDATE CASCADE;
