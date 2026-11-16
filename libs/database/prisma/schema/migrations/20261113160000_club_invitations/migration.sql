-- Personal club invitations (imported lists), and a short code, an expiry
-- and an arrival group for the join links. A new table and nullable
-- columns: no rewrite; the new unique index is on null values only.

-- AlterTable
ALTER TABLE "club" ADD COLUMN     "athlete_join_code" TEXT,
ADD COLUMN     "athlete_join_expires_at" TIMESTAMP(3),
ADD COLUMN     "athlete_join_group_id" INTEGER,
ADD COLUMN     "staff_join_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "club_invitation" (
    "club_invitation_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "club_role" NOT NULL,
    "token" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "club_id" INTEGER NOT NULL,
    "group_id" INTEGER,
    "invited_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_invitation_pkey" PRIMARY KEY ("club_invitation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_invitation_token_key" ON "club_invitation"("token");

-- CreateIndex
CREATE INDEX "club_invitation_club_id_idx" ON "club_invitation"("club_id");

-- CreateIndex
CREATE INDEX "club_invitation_invited_by_id_idx" ON "club_invitation"("invited_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_athlete_join_code_key" ON "club"("athlete_join_code");

-- AddForeignKey
ALTER TABLE "club" ADD CONSTRAINT "club_athlete_join_group_id_fkey" FOREIGN KEY ("athlete_join_group_id") REFERENCES "athlete_group"("athlete_group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invitation" ADD CONSTRAINT "club_invitation_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invitation" ADD CONSTRAINT "club_invitation_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "athlete_group"("athlete_group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invitation" ADD CONSTRAINT "club_invitation_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

