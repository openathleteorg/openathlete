-- CreateEnum
CREATE TYPE "billing_provider" AS ENUM ('stripe', 'apple');

-- AlterTable
ALTER TABLE "subscription" ADD COLUMN     "apple_app_account_token" UUID,
ADD COLUMN     "apple_original_transaction_id" TEXT,
ADD COLUMN     "provider" "billing_provider";

-- CreateIndex
CREATE UNIQUE INDEX "subscription_apple_original_transaction_id_key" ON "subscription"("apple_original_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_apple_app_account_token_key" ON "subscription"("apple_app_account_token");


-- Every subscription billed so far went through Stripe
UPDATE "subscription" SET "provider" = 'stripe' WHERE "stripe_subscription_id" IS NOT NULL;
