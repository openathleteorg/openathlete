-- A, B or C priority of a race in the season. Nullable: existing races stay
-- unranked until the athlete or coach sets it.
CREATE TYPE "competition_priority" AS ENUM ('A', 'B', 'C');

ALTER TABLE "event_competition" ADD COLUMN "priority" "competition_priority";
