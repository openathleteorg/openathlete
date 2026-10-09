-- CreateEnum
CREATE TYPE "mcp_grant_kind" AS ENUM ('OAUTH', 'PERSONAL_TOKEN');

-- CreateEnum
CREATE TYPE "mcp_token_type" AS ENUM ('ACCESS', 'REFRESH');

-- CreateTable
CREATE TABLE "oauth_client" (
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "redirect_uris" TEXT[],
    "secret_hash" TEXT,
    "client_uri" TEXT,
    "logo_uri" TEXT,
    "metadata_fetched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_client_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "mcp_grant" (
    "mcp_grant_id" SERIAL NOT NULL,
    "kind" "mcp_grant_kind" NOT NULL,
    "name" TEXT NOT NULL,
    "scopes" TEXT[],
    "token_hash" TEXT,
    "token_hint" TEXT,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "client_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_grant_pkey" PRIMARY KEY ("mcp_grant_id")
);

-- CreateTable
CREATE TABLE "mcp_token" (
    "mcp_token_id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" "mcp_token_type" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "grant_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_token_pkey" PRIMARY KEY ("mcp_token_id")
);

-- CreateTable
CREATE TABLE "oauth_authorization_code" (
    "code_hash" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "code_challenge" TEXT NOT NULL,
    "scopes" TEXT[],
    "resource" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_authorization_code_pkey" PRIMARY KEY ("code_hash")
);

-- CreateIndex
CREATE UNIQUE INDEX "mcp_grant_token_hash_key" ON "mcp_grant"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_grant_user_id_client_id_key" ON "mcp_grant"("user_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_token_token_hash_key" ON "mcp_token"("token_hash");

-- CreateIndex
CREATE INDEX "mcp_token_grant_id_idx" ON "mcp_token"("grant_id");

-- CreateIndex
CREATE INDEX "mcp_token_expires_at_idx" ON "mcp_token"("expires_at");

-- CreateIndex
CREATE INDEX "oauth_authorization_code_expires_at_idx" ON "oauth_authorization_code"("expires_at");

-- AddForeignKey
ALTER TABLE "mcp_grant" ADD CONSTRAINT "mcp_grant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_grant" ADD CONSTRAINT "mcp_grant_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_token" ADD CONSTRAINT "mcp_token_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "mcp_grant"("mcp_grant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_authorization_code" ADD CONSTRAINT "oauth_authorization_code_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_authorization_code" ADD CONSTRAINT "oauth_authorization_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

