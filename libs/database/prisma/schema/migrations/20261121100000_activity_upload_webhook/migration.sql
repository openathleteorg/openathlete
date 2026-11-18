-- CreateTable
CREATE TABLE "activity_upload_webhook" (
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "encrypted_passkey" TEXT,

    CONSTRAINT "activity_upload_webhook_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_upload_webhook_token_hash_key" ON "activity_upload_webhook"("token_hash");

-- AddForeignKey
ALTER TABLE "activity_upload_webhook" ADD CONSTRAINT "activity_upload_webhook_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
