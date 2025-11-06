-- CreateTable
CREATE TABLE "public"."athlete_settings" (
    "athlete_settings_id" SERIAL NOT NULL,
    "require_rpe" BOOLEAN NOT NULL DEFAULT false,
    "require_comment" BOOLEAN NOT NULL DEFAULT false,
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_settings_pkey" PRIMARY KEY ("athlete_settings_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athlete_settings_athlete_id_key" ON "public"."athlete_settings"("athlete_id");

-- AddForeignKey
ALTER TABLE "public"."athlete_settings" ADD CONSTRAINT "athlete_settings_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE RESTRICT ON UPDATE CASCADE;
