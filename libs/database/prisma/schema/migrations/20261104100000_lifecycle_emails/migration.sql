-- CreateEnum
CREATE TYPE "lifecycle_email_kind" AS ENUM ('CONNECT_REMINDER', 'CONNECT_QUESTION', 'IMPORT_DONE', 'PLAN_NUDGE', 'CONNECTION_LOST', 'MONTHLY_RECAP', 'SUPPORTER_ASK', 'SUPPORTER_CANCELLED');

-- AlterTable
ALTER TABLE "provider_account" ADD COLUMN     "disconnected_by_user" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "email_news_consent_at" TIMESTAMP(3),
ADD COLUMN     "email_recap" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email_tips" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "lifecycle_email" (
    "lifecycle_email_id" SERIAL NOT NULL,
    "kind" "lifecycle_email_kind" NOT NULL,
    "ref" TEXT NOT NULL DEFAULT '',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "lifecycle_email_pkey" PRIMARY KEY ("lifecycle_email_id")
);

-- CreateIndex
CREATE INDEX "lifecycle_email_user_id_sent_at_idx" ON "lifecycle_email"("user_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "lifecycle_email_user_id_kind_ref_key" ON "lifecycle_email"("user_id", "kind", "ref");

-- AddForeignKey
ALTER TABLE "lifecycle_email" ADD CONSTRAINT "lifecycle_email_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Connections revoked before this release: nobody knows whether the user
-- wanted it, so none of them gets a "your sync stopped" email
UPDATE "provider_account" SET "disconnected_by_user" = true WHERE "status" = 'revoked';
