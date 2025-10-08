-- CreateTable
CREATE TABLE "public"."cycle" (
    "cycle_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "color" TEXT,
    "athlete_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_pkey" PRIMARY KEY ("cycle_id")
);

-- AddForeignKey
ALTER TABLE "public"."cycle" ADD CONSTRAINT "cycle_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("athlete_id") ON DELETE SET NULL ON UPDATE CASCADE;
