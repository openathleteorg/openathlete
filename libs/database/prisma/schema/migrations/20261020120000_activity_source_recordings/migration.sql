-- Canonical activities can be received through multiple providers. A bare
-- external ID is not unique across providers or athlete accounts.
DROP INDEX "event_activity_external_id_key";
CREATE INDEX "event_activity_external_id_idx" ON "event_activity"("external_id");
ALTER TABLE "event_activity" ADD COLUMN "source_athlete_id" INTEGER;
UPDATE "event_activity" a SET "source_athlete_id" = e."athlete_id"
FROM "event" e WHERE e."event_id" = a."event_id" AND a."provider" IS NOT NULL;
CREATE UNIQUE INDEX "event_activity_source_athlete_id_provider_external_id_key" ON "event_activity"("source_athlete_id", "provider", "external_id");

CREATE TABLE "activity_source" (
  "activity_source_id" SERIAL NOT NULL,
  "athlete_id" INTEGER NOT NULL,
  "provider" "connector_provider" NOT NULL,
  "external_id" TEXT NOT NULL,
  "event_activity_id" INTEGER,
  "revision" INTEGER NOT NULL,
  "payload_hash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "candidates" JSONB,
  "processing_pending" BOOLEAN NOT NULL DEFAULT false,
  "resolution" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "activity_source_pkey" PRIMARY KEY ("activity_source_id")
);
CREATE UNIQUE INDEX "activity_source_athlete_id_provider_external_id_key" ON "activity_source"("athlete_id", "provider", "external_id");
CREATE INDEX "activity_source_event_activity_id_idx" ON "activity_source"("event_activity_id");
ALTER TABLE "activity_source" ADD CONSTRAINT "activity_source_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_source" ADD CONSTRAINT "activity_source_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "event_activity"("event_activity_id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "activity_source_observation" (
  "activity_source_observation_id" SERIAL NOT NULL,
  "activity_source_id" INTEGER NOT NULL,
  "revision" INTEGER NOT NULL,
  "payload_hash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_source_observation_pkey" PRIMARY KEY ("activity_source_observation_id")
);
CREATE UNIQUE INDEX "activity_source_observation_activity_source_id_revision_key" ON "activity_source_observation"("activity_source_id", "revision");
ALTER TABLE "activity_source_observation" ADD CONSTRAINT "activity_source_observation_activity_source_id_fkey" FOREIGN KEY ("activity_source_id") REFERENCES "activity_source"("activity_source_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing activities and their relationships are retained. Revision zero
-- identifies a legacy primary reference without inventing raw observations.
INSERT INTO "activity_source" ("athlete_id", "provider", "external_id", "event_activity_id", "revision", "payload_hash", "payload", "updated_at")
SELECT e."athlete_id", a."provider", a."external_id", a."event_activity_id", 0, 'legacy', jsonb_build_object('legacy', true, 'canonical', to_jsonb(a), 'event', to_jsonb(e)), CURRENT_TIMESTAMP
FROM "event_activity" a JOIN "event" e ON e."event_id" = a."event_id"
WHERE a."provider" IS NOT NULL AND e."athlete_id" IS NOT NULL;
