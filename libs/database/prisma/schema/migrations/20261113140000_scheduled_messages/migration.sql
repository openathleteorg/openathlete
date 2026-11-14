-- CreateEnum
CREATE TYPE "broadcast_mode" AS ENUM ('INDIVIDUAL', 'GROUP');

-- CreateEnum
CREATE TYPE "scheduled_message_status" AS ENUM ('PENDING', 'SENDING', 'SENT', 'CANCELED', 'FAILED');

-- CreateTable
CREATE TABLE "scheduled_message" (
    "scheduled_message_id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "mode" "broadcast_mode" NOT NULL,
    "title" TEXT,
    "recipient_user_ids" INTEGER[],
    "send_at" TIMESTAMP(3) NOT NULL,
    "status" "scheduled_message_status" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "sender_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_message_pkey" PRIMARY KEY ("scheduled_message_id")
);

-- CreateIndex
CREATE INDEX "scheduled_message_status_send_at_idx" ON "scheduled_message"("status", "send_at");

-- CreateIndex
CREATE INDEX "scheduled_message_sender_id_idx" ON "scheduled_message"("sender_id");

-- AddForeignKey
ALTER TABLE "scheduled_message" ADD CONSTRAINT "scheduled_message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
