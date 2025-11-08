-- CreateEnum
CREATE TYPE "public"."invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "public"."token_type" ADD VALUE 'COACH_INVITATION';

-- AlterTable
ALTER TABLE "public"."athlete_invitation" ADD COLUMN     "status" "public"."invitation_status",
ALTER COLUMN "token" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."coach_invitation" (
    "coach_invitation_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT,
    "status" "public"."invitation_status" NOT NULL DEFAULT 'PENDING',
    "athlete_user_id" INTEGER NOT NULL,
    "coach_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_invitation_pkey" PRIMARY KEY ("coach_invitation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coach_invitation_token_key" ON "public"."coach_invitation"("token");

-- CreateIndex
CREATE INDEX "coach_invitation_token_idx" ON "public"."coach_invitation"("token");

-- CreateIndex
CREATE INDEX "coach_invitation_email_idx" ON "public"."coach_invitation"("email");

-- CreateIndex
CREATE INDEX "coach_invitation_status_idx" ON "public"."coach_invitation"("status");

-- CreateIndex
CREATE INDEX "coach_invitation_coach_user_id_idx" ON "public"."coach_invitation"("coach_user_id");

-- CreateIndex
CREATE INDEX "athlete_invitation_status_idx" ON "public"."athlete_invitation"("status");

-- AddForeignKey
ALTER TABLE "public"."coach_invitation" ADD CONSTRAINT "coach_invitation_athlete_user_id_fkey" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coach_invitation" ADD CONSTRAINT "coach_invitation_coach_user_id_fkey" FOREIGN KEY ("coach_user_id") REFERENCES "public"."user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
