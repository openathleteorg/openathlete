-- CreateTable
CREATE TABLE "coach_note" (
    "coach_note_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "coach_user_id" INTEGER NOT NULL,
    "athlete_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_note_pkey" PRIMARY KEY ("coach_note_id")
);

-- CreateIndex
CREATE INDEX "coach_note_coach_user_id_athlete_id_idx" ON "coach_note"("coach_user_id", "athlete_id");

-- CreateIndex
CREATE INDEX "coach_note_athlete_id_idx" ON "coach_note"("athlete_id");

-- AddForeignKey
ALTER TABLE "coach_note" ADD CONSTRAINT "coach_note_coach_user_id_fkey" FOREIGN KEY ("coach_user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_note" ADD CONSTRAINT "coach_note_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;

