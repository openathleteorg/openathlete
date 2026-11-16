-- Club sessions (a place, a time, a group), their occurrences in athletes'
-- calendars (event.club_session_id, nullable: no rewrite) and attendance.
-- The event index is built concurrently in the next migration.

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "club_session_id" INTEGER;

-- CreateTable
CREATE TABLE "club_session" (
    "club_session_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "first_date" DATE NOT NULL,
    "weekly" BOOLEAN NOT NULL DEFAULT false,
    "until_date" DATE,
    "start_time" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "time_zone" TEXT NOT NULL,
    "canceled_dates" DATE[],
    "club_id" INTEGER NOT NULL,
    "group_id" INTEGER,
    "template_id" INTEGER,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_session_pkey" PRIMARY KEY ("club_session_id")
);

-- CreateTable
CREATE TABLE "club_session_attendance" (
    "date" DATE NOT NULL,
    "going" BOOLEAN NOT NULL,
    "club_session_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_session_attendance_pkey" PRIMARY KEY ("club_session_id","date","user_id")
);

-- CreateIndex
CREATE INDEX "club_session_club_id_idx" ON "club_session"("club_id");

-- CreateIndex
CREATE INDEX "club_session_attendance_user_id_idx" ON "club_session_attendance"("user_id");


-- AddForeignKey
ALTER TABLE "club_session" ADD CONSTRAINT "club_session_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_session" ADD CONSTRAINT "club_session_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "athlete_group"("athlete_group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_session" ADD CONSTRAINT "club_session_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "event_template"("event_template_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_session" ADD CONSTRAINT "club_session_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_session_attendance" ADD CONSTRAINT "club_session_attendance_club_session_id_fkey" FOREIGN KEY ("club_session_id") REFERENCES "club_session"("club_session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_session_attendance" ADD CONSTRAINT "club_session_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_club_session_id_fkey" FOREIGN KEY ("club_session_id") REFERENCES "club_session"("club_session_id") ON DELETE SET NULL ON UPDATE CASCADE;

