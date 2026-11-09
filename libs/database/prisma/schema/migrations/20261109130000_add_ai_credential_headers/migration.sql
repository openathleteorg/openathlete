-- Extra HTTP headers required by some gateways (OpenCode Go, for example),
-- stored encrypted like the API key. Nullable: existing keys need none.
ALTER TABLE "ai_credential" ADD COLUMN "encrypted_headers" TEXT;
