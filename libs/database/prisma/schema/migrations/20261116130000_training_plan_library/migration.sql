-- CreateEnum
CREATE TYPE "plan_anchor" AS ENUM ('START', 'END');

-- CreateEnum
CREATE TYPE "plan_level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "plan_modified_at" TIMESTAMP(3),
ADD COLUMN     "training_plan_id" INTEGER;

-- AlterTable
ALTER TABLE "training_plan" ADD COLUMN     "anchor" "plan_anchor",
ADD COLUMN     "template_id" INTEGER,
ADD COLUMN     "week_starts_on" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "training_plan_template" (
    "training_plan_template_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "goal" TEXT NOT NULL DEFAULT '',
    "sport" "sport_type",
    "level" "plan_level",
    "weeks" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "user_id" INTEGER NOT NULL,
    "folder_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plan_template_pkey" PRIMARY KEY ("training_plan_template_id")
);

-- CreateIndex
CREATE INDEX "training_plan_template_user_id_idx" ON "training_plan_template"("user_id");

-- CreateIndex
CREATE INDEX "training_plan_template_folder_id_idx" ON "training_plan_template"("folder_id");

-- CreateIndex
CREATE INDEX "training_plan_template_id_idx" ON "training_plan"("template_id");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "training_plan"("training_plan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan" ADD CONSTRAINT "training_plan_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "training_plan_template"("training_plan_template_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_template" ADD CONSTRAINT "training_plan_template_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plan_template" ADD CONSTRAINT "training_plan_template_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "event_template_folder"("event_template_folder_id") ON DELETE SET NULL ON UPDATE CASCADE;
