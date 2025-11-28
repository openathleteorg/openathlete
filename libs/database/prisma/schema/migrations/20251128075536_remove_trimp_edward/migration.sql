/*
  Warnings:

  - The values [TRIMP_EDWARDS,TRIMP_BANISTER] on the enum `training_load_calculation_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- Step 1: Delete all training_load_entry records linked to TRIMP_EDWARDS calculations
DELETE FROM "public"."training_load_entry"
WHERE "calculation_id" IN (
  SELECT "training_load_calculation_id"
  FROM "public"."training_load_calculation"
  WHERE "type" = 'TRIMP_EDWARDS'
);

-- Step 2: Delete all training_load_calculation records of type TRIMP_EDWARDS
DELETE FROM "public"."training_load_calculation"
WHERE "type" = 'TRIMP_EDWARDS';

-- Step 3: AlterEnum (converting TRIMP_BANISTER to TRIMP during the conversion)
BEGIN;
CREATE TYPE "public"."training_load_calculation_type_new" AS ENUM ('FOSTER_RPE', 'TRIMP');
ALTER TABLE "public"."training_load_calculation" ALTER COLUMN "type" TYPE "public"."training_load_calculation_type_new" USING (
  CASE 
    WHEN "type"::text = 'TRIMP_BANISTER' THEN 'TRIMP'::"public"."training_load_calculation_type_new"
    ELSE "type"::text::"public"."training_load_calculation_type_new"
  END
);
ALTER TYPE "public"."training_load_calculation_type" RENAME TO "training_load_calculation_type_old";
ALTER TYPE "public"."training_load_calculation_type_new" RENAME TO "training_load_calculation_type";
DROP TYPE "public"."training_load_calculation_type_old";
COMMIT;
