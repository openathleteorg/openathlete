-- Who put an event in an athlete's calendar: the athlete or one of their
-- coaches, so a coach can find and export the sessions they wrote. Nullable,
-- no rewrite: imports, club sessions and older events have no author. The
-- index is built concurrently in the next migration.

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "created_by_id" INTEGER;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
