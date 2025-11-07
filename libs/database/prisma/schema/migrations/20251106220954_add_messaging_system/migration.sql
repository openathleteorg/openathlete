-- CreateTable
CREATE TABLE "public"."message_thread" (
    "message_thread_id" SERIAL NOT NULL,
    "title" TEXT,
    "event_training_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_thread_pkey" PRIMARY KEY ("message_thread_id")
);

-- CreateTable
CREATE TABLE "public"."message_thread_participant" (
    "message_thread_participant_id" SERIAL NOT NULL,
    "last_read_at" TIMESTAMP(3),
    "message_thread_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_thread_participant_pkey" PRIMARY KEY ("message_thread_participant_id")
);

-- CreateTable
CREATE TABLE "public"."message" (
    "message_id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3),
    "message_thread_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "public"."message_read_receipt" (
    "message_read_receipt_id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_read_receipt_pkey" PRIMARY KEY ("message_read_receipt_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_thread_event_training_id_key" ON "public"."message_thread"("event_training_id");

-- CreateIndex
CREATE INDEX "message_thread_event_training_id_idx" ON "public"."message_thread"("event_training_id");

-- CreateIndex
CREATE INDEX "message_thread_participant_user_id_idx" ON "public"."message_thread_participant"("user_id");

-- CreateIndex
CREATE INDEX "message_thread_participant_message_thread_id_idx" ON "public"."message_thread_participant"("message_thread_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_thread_participant_message_thread_id_user_id_key" ON "public"."message_thread_participant"("message_thread_id", "user_id");

-- CreateIndex
CREATE INDEX "message_message_thread_id_created_at_idx" ON "public"."message"("message_thread_id", "created_at");

-- CreateIndex
CREATE INDEX "message_sender_id_idx" ON "public"."message"("sender_id");

-- CreateIndex
CREATE INDEX "message_read_receipt_user_id_idx" ON "public"."message_read_receipt"("user_id");

-- CreateIndex
CREATE INDEX "message_read_receipt_message_id_idx" ON "public"."message_read_receipt"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_read_receipt_message_id_user_id_key" ON "public"."message_read_receipt"("message_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."message_thread" ADD CONSTRAINT "message_thread_event_training_id_fkey" FOREIGN KEY ("event_training_id") REFERENCES "public"."event_training"("event_training_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_thread_participant" ADD CONSTRAINT "message_thread_participant_message_thread_id_fkey" FOREIGN KEY ("message_thread_id") REFERENCES "public"."message_thread"("message_thread_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_thread_participant" ADD CONSTRAINT "message_thread_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_message_thread_id_fkey" FOREIGN KEY ("message_thread_id") REFERENCES "public"."message_thread"("message_thread_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_read_receipt" ADD CONSTRAINT "message_read_receipt_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."message"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_read_receipt" ADD CONSTRAINT "message_read_receipt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
