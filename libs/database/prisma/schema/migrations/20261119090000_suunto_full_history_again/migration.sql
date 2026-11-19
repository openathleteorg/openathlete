-- Suunto historical imports stopped at 30 days until 1.7.0 (published
-- 2026-11-17), yet were marked complete, so Settings no longer offered the
-- full history and reconnecting kept the mark. Clearing it offers the rest
-- again, as after a partial import; activities already in are skipped.
UPDATE "provider_account"
SET "full_import_requested_at" = NULL,
    "full_import_completed_at" = NULL
WHERE "provider" = 'SUUNTO'
  AND "full_import_completed_at" < TIMESTAMP '2026-11-17 09:12:00';
