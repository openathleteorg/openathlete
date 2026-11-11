-- CreateEnum
CREATE TYPE "stored_file_purpose" AS ENUM ('COACH_NOTE', 'MESSAGE');

-- CreateTable
CREATE TABLE "coach_notebook" (
    "coach_user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_notebook_pkey" PRIMARY KEY ("coach_user_id")
);

-- CreateTable
CREATE TABLE "stored_file" (
    "stored_file_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "purpose" "stored_file_purpose" NOT NULL,
    "owner_user_id" INTEGER NOT NULL,
    "message_thread_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_file_pkey" PRIMARY KEY ("stored_file_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stored_file_key_key" ON "stored_file"("key");

-- CreateIndex
CREATE INDEX "stored_file_owner_user_id_idx" ON "stored_file"("owner_user_id");

-- CreateIndex
CREATE INDEX "stored_file_message_thread_id_idx" ON "stored_file"("message_thread_id");

-- AddForeignKey
ALTER TABLE "coach_notebook" ADD CONSTRAINT "coach_notebook_coach_user_id_fkey" FOREIGN KEY ("coach_user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_file" ADD CONSTRAINT "stored_file_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_file" ADD CONSTRAINT "stored_file_message_thread_id_fkey" FOREIGN KEY ("message_thread_id") REFERENCES "message_thread"("message_thread_id") ON DELETE CASCADE ON UPDATE CASCADE;

