-- Climbing speed records (VAM) by duration. IF NOT EXISTS: a database that
-- ran this change under its first name already has the value
ALTER TYPE "public"."record_type" ADD VALUE IF NOT EXISTS 'VERTICAL_SPEED';
