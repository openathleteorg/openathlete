-- Opt-in to the public wall of the transparency page: off for everyone,
-- each Supporter turns it on from their subscription settings
ALTER TABLE "subscription" ADD COLUMN "show_on_supporter_wall" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscription" ADD COLUMN "wall_name" TEXT;
