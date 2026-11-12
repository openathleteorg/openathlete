-- CreateEnum
CREATE TYPE "exercise_side" AS ENUM ('EACH', 'LEFT', 'RIGHT', 'ALTERNATE');

-- CreateEnum
CREATE TYPE "workout_repeat_kind" AS ENUM ('REPEAT', 'SUPERSET', 'CIRCUIT', 'EMOM', 'AMRAP', 'TABATA');

-- AlterTable
ALTER TABLE "event_activity" ADD COLUMN     "strength_log" JSONB;

-- AlterTable
ALTER TABLE "workout_repeat" ADD COLUMN     "interval_seconds" INTEGER,
ADD COLUMN     "kind" "workout_repeat_kind" NOT NULL DEFAULT 'REPEAT',
ADD COLUMN     "time_cap_seconds" INTEGER;

-- AlterTable
ALTER TABLE "workout_step" ADD COLUMN     "exercise_ref" TEXT,
ADD COLUMN     "side" "exercise_side",
ADD COLUMN     "tempo" TEXT;

-- CreateTable
CREATE TABLE "custom_exercise" (
    "custom_exercise_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL DEFAULT '',
    "media_url" TEXT,
    "body_part" TEXT,
    "equipment" TEXT,
    "default_duration_type" "workout_duration_type" NOT NULL DEFAULT 'REPS',
    "default_duration_value" DOUBLE PRECISION,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_exercise_pkey" PRIMARY KEY ("custom_exercise_id")
);

-- CreateIndex
CREATE INDEX "custom_exercise_user_id_idx" ON "custom_exercise"("user_id");

-- AddForeignKey
ALTER TABLE "custom_exercise" ADD CONSTRAINT "custom_exercise_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
