-- Heart rate by speed and by power on the about flat stretches of a run:
-- what the training check compares, as slopes blur it
ALTER TYPE "activity_profile_kind" ADD VALUE 'FLAT_SPEED';
ALTER TYPE "activity_profile_kind" ADD VALUE 'FLAT_POWER';
