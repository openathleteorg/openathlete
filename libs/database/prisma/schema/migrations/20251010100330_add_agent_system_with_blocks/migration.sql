-- CreateEnum
CREATE TYPE "public"."agent_message_role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "public"."agent_message_status" AS ENUM ('pending', 'processing', 'completed', 'error');

-- CreateEnum
CREATE TYPE "public"."agent_block_type" AS ENUM ('TEXT', 'THINKING', 'TOOL_CALL', 'TOOL_RESULT', 'CODE', 'CHART_LINE', 'CHART_BAR', 'CHART_PIE', 'CHART_SCATTER', 'CHART_AREA', 'TABLE', 'MAP', 'ACTIVITY_SUMMARY', 'TRAINING_PLAN', 'ERROR', 'IMAGE', 'FILE');

-- CreateEnum
CREATE TYPE "public"."agent_block_status" AS ENUM ('pending', 'processing', 'completed', 'error', 'cancelled');

-- CreateTable
CREATE TABLE "public"."agent_thread" (
    "thread_id" SERIAL NOT NULL,
    "title" TEXT,
    "metadata" JSONB,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_thread_pkey" PRIMARY KEY ("thread_id")
);

-- CreateTable
CREATE TABLE "public"."agent_message" (
    "message_id" SERIAL NOT NULL,
    "role" "public"."agent_message_role" NOT NULL,
    "metadata" JSONB,
    "status" "public"."agent_message_status" NOT NULL DEFAULT 'pending',
    "thread_id" INTEGER NOT NULL,
    "parent_message_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "public"."agent_message_block" (
    "block_id" SERIAL NOT NULL,
    "type" "public"."agent_block_type" NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "public"."agent_block_status" NOT NULL DEFAULT 'completed',
    "error" TEXT,
    "tool_name" TEXT,
    "tool_input" JSONB,
    "tool_output" JSONB,
    "chart_type" TEXT,
    "chart_data" JSONB,
    "message_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_message_block_pkey" PRIMARY KEY ("block_id")
);

-- CreateIndex
CREATE INDEX "agent_message_block_message_id_order_idx" ON "public"."agent_message_block"("message_id", "order");

-- AddForeignKey
ALTER TABLE "public"."agent_thread" ADD CONSTRAINT "agent_thread_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_message" ADD CONSTRAINT "agent_message_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."agent_thread"("thread_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_message" ADD CONSTRAINT "agent_message_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."agent_message"("message_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_message_block" ADD CONSTRAINT "agent_message_block_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."agent_message"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;
