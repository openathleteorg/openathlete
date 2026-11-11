-- CreateTable
CREATE TABLE "public"."ai_custom_instruction" (
    "ai_custom_instruction_id" SERIAL NOT NULL,
    "task" "public"."ai_task" NOT NULL,
    "instructions" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_custom_instruction_pkey" PRIMARY KEY ("ai_custom_instruction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_custom_instruction_user_id_task_key" ON "public"."ai_custom_instruction"("user_id", "task");

-- AddForeignKey
ALTER TABLE "public"."ai_custom_instruction" ADD CONSTRAINT "ai_custom_instruction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
