-- Imports never attached the default equipment of the activity's sport, so
-- default shoes and bikes stayed at 0 km. Attach it to the activities done
-- since the equipment was created, as imports would have, and leave the
-- activities that have equipment alone.
WITH "chosen" AS (
  SELECT DISTINCT ON (a."event_activity_id")
    a."event_activity_id",
    e."equipment_id"
  FROM "event_activity" AS a
  JOIN "event" AS ev ON ev."event_id" = a."event_id"
  JOIN "equipment" AS e
    ON e."athlete_id" = ev."athlete_id"
    AND e."is_default"
    AND a."sport" = ANY (e."sports")
    AND ev."start_date" >= e."created_at"
  WHERE a."equipment_id" IS NULL
  ORDER BY a."event_activity_id", e."created_at"
)
UPDATE "event_activity" AS a
SET "equipment_id" = "chosen"."equipment_id"
FROM "chosen"
WHERE a."event_activity_id" = "chosen"."event_activity_id";
