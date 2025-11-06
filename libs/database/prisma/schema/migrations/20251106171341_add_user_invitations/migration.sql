-- AlterEnum
ALTER TYPE "public"."token_type" ADD VALUE 'ATHLETE_INVITATION';

-- CreateTable
CREATE TABLE "public"."athlete_invitation" (
    "athlete_invitation_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_invitation_pkey" PRIMARY KEY ("athlete_invitation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athlete_invitation_token_key" ON "public"."athlete_invitation"("token");

-- CreateIndex
CREATE INDEX "athlete_invitation_token_idx" ON "public"."athlete_invitation"("token");

-- CreateIndex
CREATE INDEX "athlete_invitation_email_idx" ON "public"."athlete_invitation"("email");

-- AddForeignKey
ALTER TABLE "public"."athlete_invitation" ADD CONSTRAINT "athlete_invitation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
