-- Supporter tiers: the price paid, and founders (subscribed before the tiers)
ALTER TABLE "public"."subscription" ADD COLUMN "amount_cents" INTEGER,
ADD COLUMN "currency" TEXT,
ADD COLUMN "founder_since" TIMESTAMP(3),
ADD COLUMN "is_founder" BOOLEAN NOT NULL DEFAULT false;

-- Automatic tasks on the instance keys will have their own budget
ALTER TYPE "public"."ai_key_source" ADD VALUE 'AUTOMATED';

-- Voice notes are transcribed on the instance key: counted too
ALTER TYPE "public"."ai_task" ADD VALUE 'VOICE_TRANSCRIPTION';

-- Founders are told, once, that nothing changes for them
ALTER TYPE "public"."lifecycle_email_kind" ADD VALUE 'FOUNDER_ANNOUNCEMENT';

-- AI usage per day instead of per month. A month's row stays on its first
-- day, so the monthly totals of the past are unchanged.
ALTER TABLE "public"."ai_usage" RENAME COLUMN "month" TO "day";
ALTER INDEX "public"."ai_usage_user_id_month_task_source_key" RENAME TO "ai_usage_user_id_day_task_source_key";

-- Founders: every paid subscription running when the tiers ship. Idempotent:
-- run twice, it marks no one new, since it only runs once per database.
UPDATE "public"."subscription"
SET "is_founder" = true,
    "founder_since" = COALESCE("founder_since", "created_at")
WHERE "plan" = 'SUPPORTER'
  AND "provider" IS NOT NULL
  AND NOT "is_founder"
  AND (
    "status" IN ('active', 'trialing', 'past_due')
    OR "current_period_end" > CURRENT_TIMESTAMP
  )
  AND ("provider" <> 'apple' OR "current_period_end" > CURRENT_TIMESTAMP);

-- The App Store products sold so far stand for the lowest tier. Stripe
-- subscriptions get their amount from Stripe, at their next webhook.
UPDATE "public"."subscription"
SET "amount_cents" = CASE "billing_interval" WHEN 'year' THEN 5000 ELSE 500 END,
    "currency" = 'eur'
WHERE "provider" = 'apple' AND "amount_cents" IS NULL;
