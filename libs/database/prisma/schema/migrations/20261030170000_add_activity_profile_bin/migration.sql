-- CreateEnum
CREATE TYPE "activity_profile_kind" AS ENUM ('GRADE', 'SPEED', 'POWER', 'DRIFT_PACE', 'DRIFT_HEARTRATE', 'DRIFT_POWER');

-- CreateTable
CREATE TABLE "activity_profile_bin" (
    "event_activity_id" INTEGER NOT NULL,
    "kind" "activity_profile_kind" NOT NULL,
    "bin" INTEGER NOT NULL,
    "seconds" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "activity_profile_bin_pkey" PRIMARY KEY ("event_activity_id","kind","bin")
);

-- AddForeignKey
ALTER TABLE "activity_profile_bin" ADD CONSTRAINT "activity_profile_bin_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "event_activity"("event_activity_id") ON DELETE CASCADE ON UPDATE CASCADE;
