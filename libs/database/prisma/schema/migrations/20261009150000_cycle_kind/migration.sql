-- A cycle is a training block or a period without training. Existing cycles
-- are training blocks; a constant default adds the column without rewriting
-- the table.
CREATE TYPE "cycle_kind" AS ENUM ('TRAINING', 'TRAVEL', 'ILLNESS', 'INJURY');

ALTER TABLE "cycle" ADD COLUMN "kind" "cycle_kind" NOT NULL DEFAULT 'TRAINING';
