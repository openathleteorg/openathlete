-- CreateEnum
CREATE TYPE "club_role" AS ENUM ('OWNER', 'ADMIN', 'COACH', 'ASSISTANT', 'ATHLETE');

-- AlterTable
ALTER TABLE "coach_athlete" ADD COLUMN     "club_id" INTEGER;

-- CreateTable
CREATE TABLE "club" (
    "club_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "athlete_join_token" TEXT,
    "staff_join_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("club_id")
);

-- CreateTable
CREATE TABLE "club_member" (
    "club_member_id" SERIAL NOT NULL,
    "role" "club_role" NOT NULL,
    "club_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_member_pkey" PRIMARY KEY ("club_member_id")
);

-- CreateTable
CREATE TABLE "athlete_group" (
    "athlete_group_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "club_id" INTEGER,
    "owner_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_group_pkey" PRIMARY KEY ("athlete_group_id")
);

-- CreateTable
CREATE TABLE "athlete_group_member" (
    "athlete_group_id" INTEGER NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_group_member_pkey" PRIMARY KEY ("athlete_group_id","athlete_id")
);

-- CreateTable
CREATE TABLE "athlete_group_staff" (
    "athlete_group_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_group_staff_pkey" PRIMARY KEY ("athlete_group_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_athlete_join_token_key" ON "club"("athlete_join_token");

-- CreateIndex
CREATE UNIQUE INDEX "club_staff_join_token_key" ON "club"("staff_join_token");

-- CreateIndex
CREATE INDEX "club_member_user_id_idx" ON "club_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_member_club_id_user_id_key" ON "club_member"("club_id", "user_id");

-- CreateIndex
CREATE INDEX "athlete_group_club_id_idx" ON "athlete_group"("club_id");

-- CreateIndex
CREATE INDEX "athlete_group_owner_user_id_idx" ON "athlete_group"("owner_user_id");

-- CreateIndex
CREATE INDEX "athlete_group_parent_id_idx" ON "athlete_group"("parent_id");

-- CreateIndex
CREATE INDEX "athlete_group_member_athlete_id_idx" ON "athlete_group_member"("athlete_id");

-- CreateIndex
CREATE INDEX "athlete_group_staff_user_id_idx" ON "athlete_group_staff"("user_id");

-- CreateIndex
CREATE INDEX "coach_athlete_club_id_idx" ON "coach_athlete"("club_id");

-- AddForeignKey
ALTER TABLE "coach_athlete" ADD CONSTRAINT "coach_athlete_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_member" ADD CONSTRAINT "club_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_group" ADD CONSTRAINT "athlete_group_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "athlete_group"("athlete_group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_group" ADD CONSTRAINT "athlete_group_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_group" ADD CONSTRAINT "athlete_group_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_group_member" ADD CONSTRAINT "athlete_group_member_athlete_group_id_fkey" FOREIGN KEY ("athlete_group_id") REFERENCES "athlete_group"("athlete_group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_group_member" ADD CONSTRAINT "athlete_group_member_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athlete"("athlete_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_group_staff" ADD CONSTRAINT "athlete_group_staff_athlete_group_id_fkey" FOREIGN KEY ("athlete_group_id") REFERENCES "athlete_group"("athlete_group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_group_staff" ADD CONSTRAINT "athlete_group_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A group belongs to a club or to a coach, never both nor neither
ALTER TABLE "athlete_group" ADD CONSTRAINT "athlete_group_owner_check" CHECK (("club_id" IS NULL) <> ("owner_user_id" IS NULL));
