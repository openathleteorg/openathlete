import alpineSkiing from '@/assets/icons/sports/alpine_skiing.svg';
import biking from '@/assets/icons/sports/biking.svg';
import climbingStairs from '@/assets/icons/sports/climbing_stairs.svg';
import crossCountrySkiing from '@/assets/icons/sports/cross_country_skiing.svg';
import ellipticalTraining from '@/assets/icons/sports/elliptical_training.svg';
import exerciseDumbbells from '@/assets/icons/sports/exercise_dumbbells.svg';
import figureSkating from '@/assets/icons/sports/figure_skating.svg';
import fitness from '@/assets/icons/sports/fitness.svg';
import freestyleSkiing from '@/assets/icons/sports/freestyle_skiing.svg';
import hiking from '@/assets/icons/sports/hiking.svg';
import kayaking from '@/assets/icons/sports/kayaking.svg';
import playingBadminton from '@/assets/icons/sports/playing_badminton.svg';
import playingGolf from '@/assets/icons/sports/playing_golf.svg';
import playingSoccer from '@/assets/icons/sports/playing_soccer.svg';
import playingTennis from '@/assets/icons/sports/playing_tennis.svg';
import rockClimbing from '@/assets/icons/sports/rock_climbing.svg';
import rowingMachine from '@/assets/icons/sports/rowing_machine.svg';
import run from '@/assets/icons/sports/run.svg';
import sailing from '@/assets/icons/sports/sailing.svg';
import skateboarding from '@/assets/icons/sports/skateboarding.svg';
import speedSkating from '@/assets/icons/sports/speed_skating.svg';
import stretch01 from '@/assets/icons/sports/stretch_01.svg';
import sup from '@/assets/icons/sports/sup.svg';
import surfing from '@/assets/icons/sports/surfing.svg';
import swim from '@/assets/icons/sports/swimming.svg';
import trailRun from '@/assets/icons/sports/trail_run.svg';
import treadmillRunning from '@/assets/icons/sports/treadmill_running.svg';
import treePose from '@/assets/icons/sports/tree_pose.svg';
import walk from '@/assets/icons/sports/walk.svg';
import { cn } from '@/utils/shadcn';
import { useMemo } from 'react';

import { SPORT_TYPE } from '@openathlete/shared';

interface P {
  sport: SPORT_TYPE;
  className?: string;
}

export function SportIcon({ sport, className }: P) {
  const icon = useMemo(() => {
    switch (sport) {
      case SPORT_TYPE.RUNNING:
        return run;
      case SPORT_TYPE.TRAIL_RUNNING:
        return trailRun;
      case SPORT_TYPE.CYCLING:
        return biking;
      case SPORT_TYPE.SWIMMING:
        return swim;
      case SPORT_TYPE.ROCK_CLIMBING:
        return rockClimbing;
      case SPORT_TYPE.HIKING:
        return hiking;
      case SPORT_TYPE.STRENGTH:
        return exerciseDumbbells;
      case SPORT_TYPE.CROSSFIT:
        return fitness;
      case SPORT_TYPE.YOGA:
        return treePose;
      case SPORT_TYPE.ALPINE_SKI:
        return alpineSkiing;
      case SPORT_TYPE.BACKCOUNTRY_SKI:
        return crossCountrySkiing;
      case SPORT_TYPE.BADMINTON:
        return playingBadminton;
      case SPORT_TYPE.CANOEING:
        return kayaking;
      case SPORT_TYPE.E_BIKE_RIDE:
        return biking;
      case SPORT_TYPE.ELLIPTICAL:
        return ellipticalTraining;
      case SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE:
        return biking;
      case SPORT_TYPE.GOLF:
        return playingGolf;
      case SPORT_TYPE.GRAVEL_RIDE:
        return biking;
      case SPORT_TYPE.HANDCYCLE:
        return biking;
      case SPORT_TYPE.HIGH_INTENSITY_INTERVAL_TRAINING:
        return fitness;
      case SPORT_TYPE.ICE_SKATE:
        return figureSkating;
      case SPORT_TYPE.INLINE_SKATE:
        return speedSkating;
      case SPORT_TYPE.KAYAKING:
        return kayaking;
      case SPORT_TYPE.KITESURF:
        return surfing;
      case SPORT_TYPE.MOUNTAIN_BIKE_RIDE:
        return biking;
      case SPORT_TYPE.NORDIC_SKI:
        return crossCountrySkiing;
      case SPORT_TYPE.PICKLEBALL:
        return playingTennis;
      case SPORT_TYPE.PILATES:
        return stretch01;
      case SPORT_TYPE.RACQUETBALL:
        return playingTennis;
      case SPORT_TYPE.ROLLER_SKI:
        return speedSkating;
      case SPORT_TYPE.ROWING:
        return rowingMachine;
      case SPORT_TYPE.SAIL:
        return sailing;
      case SPORT_TYPE.SKATEBOARD:
        return skateboarding;
      case SPORT_TYPE.SNOWBOARD:
        return freestyleSkiing;
      case SPORT_TYPE.SNOWSHOE:
        return hiking;
      case SPORT_TYPE.SOCCER:
        return playingSoccer;
      case SPORT_TYPE.SQUASH:
        return playingTennis;
      case SPORT_TYPE.STAIR_STEPPER:
        return climbingStairs;
      case SPORT_TYPE.STAND_UP_PADDLING:
        return sup;
      case SPORT_TYPE.SURFING:
        return surfing;
      case SPORT_TYPE.TABLE_TENNIS:
        return playingTennis;
      case SPORT_TYPE.TENNIS:
        return playingTennis;
      case SPORT_TYPE.VELOMOBILE:
        return biking;
      case SPORT_TYPE.VIRTUAL_RIDE:
        return biking;
      case SPORT_TYPE.VIRTUAL_ROW:
        return rowingMachine;
      case SPORT_TYPE.VIRTUAL_RUN:
        return treadmillRunning;
      case SPORT_TYPE.WALK:
        return walk;
      case SPORT_TYPE.WEIGHT_TRAINING:
        return exerciseDumbbells;
      case SPORT_TYPE.WHEELCHAIR:
        return biking;
      case SPORT_TYPE.WINDSURF:
        return surfing;
      case SPORT_TYPE.WORKOUT:
        return fitness;
      case SPORT_TYPE.OTHER:
        return fitness;
      default:
        return fitness;
    }
  }, [sport]);

  if (!icon) {
    return null;
  }
  return <img src={icon} alt={sport} className={cn('w-4 h-4', className)} />;
}
