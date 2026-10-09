-- Random token of the athlete's calendar feed URL. The feed used to compare
-- its secret with an Argon2 hash of every user on each request; a unique
-- token finds the athlete in one indexed read. Existing feed URLs stop
-- working: the settings page shows the new one.
ALTER TABLE "athlete" ADD COLUMN "calendar_feed_token" TEXT;

CREATE UNIQUE INDEX "athlete_calendar_feed_token_key" ON "athlete"("calendar_feed_token");
