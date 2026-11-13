-- AlterTable
ALTER TABLE "user" ADD COLUMN "coach_join_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_coach_join_token_key" ON "user"("coach_join_token");
