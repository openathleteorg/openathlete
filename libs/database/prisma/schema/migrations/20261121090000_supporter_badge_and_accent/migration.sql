-- Supporter perks: the badge others see (on by default) and the accent
-- colour of the app. Both columns have a default or allow null: no backfill.
ALTER TABLE "subscription" ADD COLUMN "show_supporter_badge" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user" ADD COLUMN "accent_theme" TEXT;
