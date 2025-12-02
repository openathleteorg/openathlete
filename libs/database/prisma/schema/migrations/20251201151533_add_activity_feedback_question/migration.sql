-- CreateEnum
CREATE TYPE "public"."injury_status" AS ENUM ('WORSENING', 'IMPROVING', 'STABLE', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."activity_feedback_question" (
    "activity_feedback_question_id" SERIAL NOT NULL,
    "question_text" TEXT NOT NULL,
    "qcm_options" JSONB,
    "answer_text" TEXT,
    "event_activity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_feedback_question_pkey" PRIMARY KEY ("activity_feedback_question_id")
);

-- CreateTable
CREATE TABLE "public"."athlete_injury" (
    "athlete_injury_id" SERIAL NOT NULL,
    "location" TEXT NOT NULL,
    "pain_score" DOUBLE PRECISION NOT NULL,
    "context" TEXT NOT NULL,
    "status" "public"."injury_status" NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_injury_pkey" PRIMARY KEY ("athlete_injury_id")
);

-- CreateIndex
CREATE INDEX "activity_feedback_question_event_activity_id_idx" ON "public"."activity_feedback_question"("event_activity_id");

-- CreateIndex
CREATE INDEX "athlete_injury_athlete_id_idx" ON "public"."athlete_injury"("athlete_id");

-- AddForeignKey
ALTER TABLE "public"."activity_feedback_question" ADD CONSTRAINT "activity_feedback_question_event_activity_id_fkey" FOREIGN KEY ("event_activity_id") REFERENCES "public"."event_activity"("event_activity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."athlete_injury" ADD CONSTRAINT "athlete_injury_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE RESTRICT ON UPDATE CASCADE;
