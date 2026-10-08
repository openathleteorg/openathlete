-- Garmin "Mobility" activities used to be imported as PILATES. Correct the
-- ones that still carry Garmin's default mobility name. A separate migration:
-- a new enum value cannot be used in the transaction that adds it.
UPDATE "event_activity" AS a
SET "sport" = 'MOBILITY'
FROM "event" AS e
WHERE e."event_id" = a."event_id"
  AND a."provider" = 'GARMIN'
  AND a."sport" = 'PILATES'
  AND e."name" IN ('Mobility', 'Movilidad', 'Mobilité', 'Mobilità', 'Mobilität');

-- Zone values stored with every sport mean "all sports" (default zones are
-- created that way): include the new sport too. Explicit subsets are kept.
UPDATE "training_zone_value"
SET "sports" = array_append("sports", 'MOBILITY')
WHERE NOT ('MOBILITY' = ANY("sports"))
  AND NOT EXISTS (
    SELECT 1
    FROM unnest(enum_range(NULL::"sport_type")) AS sport
    WHERE sport <> 'MOBILITY' AND NOT (sport = ANY("sports"))
  );
