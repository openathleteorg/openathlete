-- A ZONE target names one zone of the session's athlete, in target_value.
-- AI-generated sessions could store a range of zone ids in target_min and
-- target_max instead ("zone 2 to zone 3"): the athlete saw two raw ids, the
-- watch got no target, and 20261103120000_remap_foreign_zone_targets, which
-- reads target_value only, left a coach's zones in place. Such a target keeps
-- its lower zone, then the remapping of that migration runs again: it only
-- touches zones of another athlete, so other targets are unchanged.
UPDATE "workout_step_target"
SET
  "target_value" = "target_min",
  "target_min" = NULL,
  "target_max" = NULL,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "target_type" = 'ZONE'
  AND "target_value" IS NULL
  AND "target_min" IS NOT NULL;

WITH RECURSIVE step_workout AS (
  SELECT ws."workout_step_id", ws."workout_id"
  FROM "workout_step" ws
  WHERE ws."workout_id" IS NOT NULL
  UNION ALL
  -- Steps inside a repeat block point to the block, not to the workout
  SELECT child."workout_step_id", parent."workout_id"
  FROM "workout_step" child
  JOIN "workout_repeat" wr ON wr."workout_repeat_id" = child."repeat_parent_id"
  JOIN step_workout parent ON parent."workout_step_id" = wr."step_id"
),
candidates AS (
  SELECT
    t."workout_step_target_id",
    e."athlete_id",
    et."sport",
    src."training_zone_id" AS source_id,
    src."athlete_id" AS source_athlete_id,
    src."type"
  FROM "workout_step_target" t
  JOIN step_workout sw ON sw."workout_step_id" = t."step_id"
  JOIN "workout" w ON w."workout_id" = sw."workout_id"
  JOIN "event_training" et ON et."event_training_id" = w."event_training_id"
  JOIN "event" e ON e."event_id" = et."event_id"
  JOIN "training_zone" src ON src."training_zone_id" = t."target_value"
  WHERE t."target_type" = 'ZONE'
    AND e."athlete_id" IS NOT NULL
    AND src."athlete_id" <> e."athlete_id"
),
involved AS (
  SELECT "athlete_id", "sport" FROM candidates
  UNION
  SELECT source_athlete_id, "sport" FROM candidates
),
-- Each athlete's zones of a type that have bounds for the sport, in order
by_sport AS (
  SELECT
    i."athlete_id",
    i."sport",
    z."type",
    z."training_zone_id",
    ROW_NUMBER() OVER (
      PARTITION BY i."athlete_id", i."sport", z."type"
      ORDER BY z."index", z."training_zone_id"
    ) AS position
  FROM involved i
  JOIN "training_zone" z ON z."athlete_id" = i."athlete_id"
  WHERE EXISTS (
    SELECT 1
    FROM "training_zone_value" v
    WHERE v."training_zone_id" = z."training_zone_id"
      AND (COALESCE(cardinality(v."sports"), 0) = 0 OR i."sport" = ANY(v."sports"))
  )
),
-- Each athlete's zones of a type, whatever the sport, in order
by_type AS (
  SELECT
    z."athlete_id",
    z."type",
    z."training_zone_id",
    ROW_NUMBER() OVER (
      PARTITION BY z."athlete_id", z."type"
      ORDER BY z."index", z."training_zone_id"
    ) AS position
  FROM "training_zone" z
  WHERE z."athlete_id" IN (SELECT "athlete_id" FROM involved)
),
remap AS (
  SELECT
    c."workout_step_target_id",
    CASE
      WHEN EXISTS (
        SELECT 1 FROM by_sport s
        WHERE s."training_zone_id" = c.source_id AND s."sport" = c."sport"
      ) THEN (
        SELECT dst."training_zone_id"
        FROM by_sport s
        JOIN by_sport dst
          ON dst."athlete_id" = c."athlete_id"
          AND dst."sport" = c."sport"
          AND dst."type" = c."type"
          AND dst.position = s.position
        WHERE s."training_zone_id" = c.source_id AND s."sport" = c."sport"
      )
      ELSE (
        SELECT dst."training_zone_id"
        FROM by_type s
        JOIN by_type dst
          ON dst."athlete_id" = c."athlete_id"
          AND dst."type" = c."type"
          AND dst.position = s.position
        WHERE s."training_zone_id" = c.source_id
      )
    END AS zone_id
  FROM candidates c
)
UPDATE "workout_step_target" t
SET "target_value" = r.zone_id, "updated_at" = CURRENT_TIMESTAMP
FROM remap r
WHERE r."workout_step_target_id" = t."workout_step_target_id"
  AND r.zone_id IS NOT NULL;
