-- CreateEnum
CREATE TYPE "question_type" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'SCALE', 'NUMBER', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO');

-- CreateEnum
CREATE TYPE "questionnaire_score" AS ENUM ('NONE', 'SUM', 'AVERAGE');

-- AlterEnum
ALTER TYPE "event_type" ADD VALUE 'QUESTIONNAIRE';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "email_questionnaires" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "questionnaire" (
    "questionnaire_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "score_kind" "questionnaire_score" NOT NULL DEFAULT 'NONE',
    "score_metric_type" "metric_type",
    "archived_at" TIMESTAMP(3),
    "coach_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_pkey" PRIMARY KEY ("questionnaire_id")
);

-- CreateTable
CREATE TABLE "questionnaire_question" (
    "question_id" SERIAL NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "question_type" NOT NULL,
    "label" TEXT NOT NULL,
    "help" TEXT NOT NULL DEFAULT '',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "in_score" BOOLEAN NOT NULL DEFAULT false,
    "metric_type" "metric_type",
    "archived_at" TIMESTAMP(3),
    "questionnaire_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "event_questionnaire" (
    "event_questionnaire_id" SERIAL NOT NULL,
    "answered_at" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "notified_at" TIMESTAMP(3),
    "reminded_at" TIMESTAMP(3),
    "event_id" INTEGER NOT NULL,
    "questionnaire_id" INTEGER NOT NULL,
    "club_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_questionnaire_pkey" PRIMARY KEY ("event_questionnaire_id")
);

-- CreateTable
CREATE TABLE "questionnaire_answer" (
    "answer_id" SERIAL NOT NULL,
    "value_number" DOUBLE PRECISION,
    "value_text" TEXT,
    "value_options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "event_questionnaire_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_answer_pkey" PRIMARY KEY ("answer_id")
);

-- CreateIndex
CREATE INDEX "questionnaire_coach_user_id_idx" ON "questionnaire"("coach_user_id");

-- CreateIndex
CREATE INDEX "questionnaire_question_questionnaire_id_position_idx" ON "questionnaire_question"("questionnaire_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "event_questionnaire_event_id_key" ON "event_questionnaire"("event_id");

-- CreateIndex
CREATE INDEX "event_questionnaire_questionnaire_id_idx" ON "event_questionnaire"("questionnaire_id");

-- CreateIndex
CREATE INDEX "event_questionnaire_club_id_idx" ON "event_questionnaire"("club_id");

-- CreateIndex
CREATE INDEX "event_questionnaire_notified_at_answered_at_idx" ON "event_questionnaire"("notified_at", "answered_at");

-- CreateIndex
CREATE INDEX "questionnaire_answer_question_id_idx" ON "questionnaire_answer"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_answer_event_questionnaire_id_question_id_key" ON "questionnaire_answer"("event_questionnaire_id", "question_id");

-- AddForeignKey
ALTER TABLE "questionnaire" ADD CONSTRAINT "questionnaire_coach_user_id_fkey" FOREIGN KEY ("coach_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_question" ADD CONSTRAINT "questionnaire_question_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaire"("questionnaire_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_questionnaire" ADD CONSTRAINT "event_questionnaire_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_questionnaire" ADD CONSTRAINT "event_questionnaire_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaire"("questionnaire_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_questionnaire" ADD CONSTRAINT "event_questionnaire_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_answer" ADD CONSTRAINT "questionnaire_answer_event_questionnaire_id_fkey" FOREIGN KEY ("event_questionnaire_id") REFERENCES "event_questionnaire"("event_questionnaire_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_answer" ADD CONSTRAINT "questionnaire_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questionnaire_question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;
