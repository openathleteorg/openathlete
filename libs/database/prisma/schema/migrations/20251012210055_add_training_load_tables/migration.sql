-- CreateEnum
CREATE TYPE "public"."training_load_calculation_type" AS ENUM ('FOSTER_RPE', 'TRIMP_EDWARDS', 'TRIMP_BANISTER');

-- CreateTable
CREATE TABLE "public"."training_load_calculation" (
    "training_load_calculation_id" SERIAL NOT NULL,
    "type" "public"."training_load_calculation_type" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_load_calculation_pkey" PRIMARY KEY ("training_load_calculation_id")
);

-- CreateTable
CREATE TABLE "public"."training_load_entry" (
    "training_load_entry_id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "calculation_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_load_entry_pkey" PRIMARY KEY ("training_load_entry_id")
);

-- CreateIndex
CREATE INDEX "training_load_calculation_athlete_id_type_idx" ON "public"."training_load_calculation"("athlete_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "training_load_calculation_athlete_id_type_key" ON "public"."training_load_calculation"("athlete_id", "type");

-- CreateIndex
CREATE INDEX "training_load_entry_calculation_id_date_idx" ON "public"."training_load_entry"("calculation_id", "date");

-- CreateIndex
CREATE INDEX "training_load_entry_activity_id_idx" ON "public"."training_load_entry"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_load_entry_calculation_id_activity_id_key" ON "public"."training_load_entry"("calculation_id", "activity_id");

-- AddForeignKey
ALTER TABLE "public"."training_load_calculation" ADD CONSTRAINT "training_load_calculation_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_load_entry" ADD CONSTRAINT "training_load_entry_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "public"."training_load_calculation"("training_load_calculation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_load_entry" ADD CONSTRAINT "training_load_entry_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."event_activity"("event_activity_id") ON DELETE CASCADE ON UPDATE CASCADE;
