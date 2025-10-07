-- CreateTable
CREATE TABLE "public"."event_activity_weather" (
    "event_activity_weather_id" SERIAL NOT NULL,
    "resolution_m" INTEGER NOT NULL DEFAULT 500,
    "provider" TEXT,
    "samples" JSONB NOT NULL,
    "event_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_activity_weather_pkey" PRIMARY KEY ("event_activity_weather_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_activity_weather_event_activity_id_key" ON "public"."event_activity_weather"("event_activity_id");

-- AddForeignKey
ALTER TABLE "public"."event_activity_weather" ADD CONSTRAINT "event_activity_weather_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "public"."event_activity"("event_activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;
