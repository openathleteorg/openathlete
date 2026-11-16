-- Templates and folders a club shares with its coaches. Nullable columns on
-- small tables: no rewrite, no concurrent index needed.

-- AlterTable
ALTER TABLE "event_template" ADD COLUMN     "club_id" INTEGER;

-- AlterTable
ALTER TABLE "event_template_folder" ADD COLUMN     "club_id" INTEGER;

-- CreateIndex
CREATE INDEX "event_template_club_id_idx" ON "event_template"("club_id");

-- CreateIndex
CREATE INDEX "event_template_folder_club_id_idx" ON "event_template_folder"("club_id");

-- AddForeignKey
ALTER TABLE "event_template" ADD CONSTRAINT "event_template_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_template_folder" ADD CONSTRAINT "event_template_folder_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE CASCADE ON UPDATE CASCADE;
