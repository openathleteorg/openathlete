-- CreateEnum
CREATE TYPE "public"."normalization_factor" AS ENUM ('SLOPE', 'TEMPERATURE', 'ALTITUDE', 'WIND', 'HUMIDITY', 'RADIATION');

-- AlterTable
ALTER TABLE "public"."event_activity" ADD COLUMN     "average_normalized_speed" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."event_activity_normalization" (
    "event_activity_normalization_id" SERIAL NOT NULL,
    "average_normalized_speed" DOUBLE PRECISION,
    "event_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_activity_normalization_pkey" PRIMARY KEY ("event_activity_normalization_id")
);

-- CreateTable
CREATE TABLE "public"."event_activity_normalization_factor" (
    "event_activity_normalization_factor_id" SERIAL NOT NULL,
    "factor" "public"."normalization_factor" NOT NULL,
    "time_seconds" DOUBLE PRECISION NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "event_activity_normalization_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_activity_normalization_factor_pkey" PRIMARY KEY ("event_activity_normalization_factor_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_activity_normalization_event_activity_id_key" ON "public"."event_activity_normalization"("event_activity_id");

-- AddForeignKey
ALTER TABLE "public"."event_activity_normalization" ADD CONSTRAINT "event_activity_normalization_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "public"."event_activity"("event_activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_activity_normalization_factor" ADD CONSTRAINT "event_activity_normalization_factor_event_activity_normali_fkey" FOREIGN KEY ("event_activity_normalization_id") REFERENCES "public"."event_activity_normalization"("event_activity_normalization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
