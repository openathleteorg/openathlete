-- AlterTable
ALTER TABLE "public"."provider_account" ADD COLUMN     "external_user_id" TEXT;

-- CreateIndex
CREATE INDEX "provider_account_external_user_id_idx" ON "public"."provider_account"("external_user_id");
