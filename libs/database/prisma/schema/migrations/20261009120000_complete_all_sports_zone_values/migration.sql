-- Zone values saved with every sport of their time mean "all sports" (default
-- zones are created that way), but the sports added since then don't reach
-- them: an athlete's zones from 2025 don't apply to a triathlon. Give every
-- current sport to the values whose list equals the whole sport_type enum of
-- an earlier release, in any order. Other selections are kept. A completed
-- value matches none of these lists, so running this again changes nothing.
--
-- The enum of 20251215142214_add_multisports (every sport but Mobility) is
-- left out: 20261008065324_mobility_activities_and_zones already completed
-- those values, so such a list saved since then may be a deliberate choice.
WITH
  -- 20250327081138_add_sport_types: the sports when training zones arrived
  "march_2025" ("sports") AS (
    SELECT ARRAY[
      'RUNNING', 'CYCLING', 'SWIMMING', 'OTHER', 'TRAIL_RUNNING',
      'ROCK_CLIMBING', 'HIKING'
    ]::"sport_type"[]
  ),
  -- 20251013114759_add_strength_sports
  "october_2025" ("sports") AS (
    SELECT "sports" || ARRAY['STRENGTH', 'CROSSFIT', 'YOGA']::"sport_type"[]
    FROM "march_2025"
  ),
  -- 20251118145053_add_more_sports
  "november_2025" ("sports") AS (
    SELECT "sports" || ARRAY[
      'ALPINE_SKI', 'BACKCOUNTRY_SKI', 'BADMINTON', 'CANOEING',
      'E_BIKE_RIDE', 'ELLIPTICAL', 'E_MOUNTAIN_BIKE_RIDE', 'GOLF',
      'GRAVEL_RIDE', 'HANDCYCLE', 'HIGH_INTENSITY_INTERVAL_TRAINING',
      'ICE_SKATE', 'INLINE_SKATE', 'KAYAKING', 'KITESURF',
      'MOUNTAIN_BIKE_RIDE', 'NORDIC_SKI', 'PICKLEBALL', 'PILATES',
      'RACQUETBALL', 'ROLLER_SKI', 'ROWING', 'SAIL', 'SKATEBOARD',
      'SNOWBOARD', 'SNOWSHOE', 'SOCCER', 'SQUASH', 'STAIR_STEPPER',
      'STAND_UP_PADDLING', 'SURFING', 'TABLE_TENNIS', 'TENNIS', 'VELOMOBILE',
      'VIRTUAL_RIDE', 'VIRTUAL_ROW', 'VIRTUAL_RUN', 'WALK',
      'WEIGHT_TRAINING', 'WHEELCHAIR', 'WINDSURF', 'WORKOUT'
    ]::"sport_type"[]
    FROM "october_2025"
  ),
  "former_complete" ("sports") AS (
    SELECT "sports" FROM "march_2025"
    UNION ALL SELECT "sports" FROM "october_2025"
    UNION ALL SELECT "sports" FROM "november_2025"
  )
UPDATE "training_zone_value" AS v
SET "sports" = enum_range(NULL::"sport_type")
WHERE EXISTS (
  SELECT 1
  FROM "former_complete" AS f
  -- Each contains the other: the same sports, whatever their order
  WHERE v."sports" @> f."sports" AND v."sports" <@ f."sports"
);
