-- CreateTable
CREATE TABLE "garmin_personal_connection" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "encrypted_credentials" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "activities" BOOLEAN NOT NULL DEFAULT false,
    "automatic" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "lease_id" TEXT,
    "lease_until" TIMESTAMP(3),
    "error" TEXT,
    "result" JSONB,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garmin_personal_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garmin_personal_item" (
    "id" SERIAL NOT NULL,
    "connection_id" INTEGER NOT NULL,
    "external_id" TEXT NOT NULL,
    "event_activity_id" INTEGER,
    "processing_pending" BOOLEAN NOT NULL DEFAULT false,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garmin_personal_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "garmin_personal_connection_athlete_id_key" ON "garmin_personal_connection"("athlete_id");

-- CreateIndex
CREATE UNIQUE INDEX "garmin_personal_item_connection_id_external_id_key" ON "garmin_personal_item"("connection_id", "external_id");

-- AddForeignKey
ALTER TABLE "garmin_personal_connection" ADD CONSTRAINT "garmin_personal_connection_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garmin_personal_item" ADD CONSTRAINT "garmin_personal_item_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "garmin_personal_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garmin_personal_item" ADD CONSTRAINT "garmin_personal_item_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "event_activity"("event_activity_id") ON DELETE SET NULL ON UPDATE CASCADE;
