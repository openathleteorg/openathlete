-- AlterTable
ALTER TABLE "public"."event_template" ADD COLUMN     "folder_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."event_template_folder" (
    "event_template_folder_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6366f1',
    "description" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,
    "parent_folder_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_template_folder_pkey" PRIMARY KEY ("event_template_folder_id")
);

-- CreateIndex
CREATE INDEX "event_template_folder_user_id_idx" ON "public"."event_template_folder"("user_id");

-- CreateIndex
CREATE INDEX "event_template_folder_parent_folder_id_idx" ON "public"."event_template_folder"("parent_folder_id");

-- CreateIndex
CREATE INDEX "event_template_folder_id_idx" ON "public"."event_template"("folder_id");

-- AddForeignKey
ALTER TABLE "public"."event_template" ADD CONSTRAINT "event_template_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."event_template_folder"("event_template_folder_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_template_folder" ADD CONSTRAINT "event_template_folder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_template_folder" ADD CONSTRAINT "event_template_folder_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."event_template_folder"("event_template_folder_id") ON DELETE SET NULL ON UPDATE CASCADE;
