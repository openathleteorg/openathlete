-- CreateEnum
CREATE TYPE "public"."subscription_plan" AS ENUM ('FREE', 'ATHLETE_PRO', 'COACH_PRO', 'COACH_ULTRA', 'CLUB_PRO', 'CLUB_ULTRA');

-- CreateEnum
CREATE TYPE "public"."subscription_status" AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid');

-- CreateTable
CREATE TABLE "public"."subscription" (
    "subscription_id" SERIAL NOT NULL,
    "plan" "public"."subscription_plan" NOT NULL,
    "status" "public"."subscription_status" NOT NULL DEFAULT 'active',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripe_customer_id_key" ON "public"."subscription"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripe_subscription_id_key" ON "public"."subscription"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_user_id_key" ON "public"."subscription"("user_id");

-- CreateIndex
CREATE INDEX "subscription_user_id_idx" ON "public"."subscription"("user_id");

-- CreateIndex
CREATE INDEX "subscription_stripe_customer_id_idx" ON "public"."subscription"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "subscription_stripe_subscription_id_idx" ON "public"."subscription"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscription_status_idx" ON "public"."subscription"("status");

-- AddForeignKey
ALTER TABLE "public"."subscription" ADD CONSTRAINT "subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
