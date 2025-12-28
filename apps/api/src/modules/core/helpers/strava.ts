import { SportType } from '@openathlete/database';

/**
 * Maps Strava sport type to our sport type
 * @param type - Strava sport type (AlpineSki, BackcountrySki, Badminton, Canoeing, Crossfit, EBikeRide, Elliptical, EMountainBikeRide, Golf, GravelRide, Handcycle, HighIntensityIntervalTraining, Hike, IceSkate, InlineSkate, Kayaking, Kitesurf, MountainBikeRide, NordicSki, Pickleball, Pilates, Racquetball, Ride, RockClimbing, RollerSki, Rowing, Run, Sail, Skateboard, Snowboard, Snowshoe, Soccer, Squash, StairStepper, StandUpPaddling, Surfing, Swim, TableTennis, Tennis, TrailRun, Velomobile, VirtualRide, VirtualRow, VirtualRun, Walk, WeightTraining, Wheelchair, Windsurf, Workout, Yoga)
 * @returns sport type
 */
export const mapStravaSportType = (type: string): SportType => {
  switch (type) {
    case 'Run':
      return SportType.RUNNING;
    case 'TrailRun':
      return SportType.TRAIL_RUNNING;
    case 'Ride':
      return SportType.CYCLING;
    case 'Swim':
      return SportType.SWIMMING;
    case 'RockClimbing':
      return SportType.ROCK_CLIMBING;
    case 'Hike':
      return SportType.HIKING;
    case 'Crossfit':
      return SportType.CROSSFIT;
    case 'Yoga':
      return SportType.YOGA;
    case 'AlpineSki':
      return SportType.ALPINE_SKI;
    case 'BackcountrySki':
      return SportType.BACKCOUNTRY_SKI;
    case 'Badminton':
      return SportType.BADMINTON;
    case 'Canoeing':
      return SportType.CANOEING;
    case 'EBikeRide':
      return SportType.E_BIKE_RIDE;
    case 'Elliptical':
      return SportType.ELLIPTICAL;
    case 'EMountainBikeRide':
      return SportType.E_MOUNTAIN_BIKE_RIDE;
    case 'Golf':
      return SportType.GOLF;
    case 'GravelRide':
      return SportType.GRAVEL_RIDE;
    case 'Handcycle':
      return SportType.HANDCYCLE;
    case 'HighIntensityIntervalTraining':
      return SportType.HIGH_INTENSITY_INTERVAL_TRAINING;
    case 'IceSkate':
      return SportType.ICE_SKATE;
    case 'InlineSkate':
      return SportType.INLINE_SKATE;
    case 'Kayaking':
      return SportType.KAYAKING;
    case 'Kitesurf':
      return SportType.KITESURF;
    case 'MountainBikeRide':
      return SportType.MOUNTAIN_BIKE_RIDE;
    case 'NordicSki':
      return SportType.NORDIC_SKI;
    case 'Pickleball':
      return SportType.PICKLEBALL;
    case 'Pilates':
      return SportType.PILATES;
    case 'Racquetball':
      return SportType.RACQUETBALL;
    case 'RollerSki':
      return SportType.ROLLER_SKI;
    case 'Rowing':
      return SportType.ROWING;
    case 'Sail':
      return SportType.SAIL;
    case 'Skateboard':
      return SportType.SKATEBOARD;
    case 'Snowboard':
      return SportType.SNOWBOARD;
    case 'Snowshoe':
      return SportType.SNOWSHOE;
    case 'Soccer':
      return SportType.SOCCER;
    case 'Squash':
      return SportType.SQUASH;
    case 'StairStepper':
      return SportType.STAIR_STEPPER;
    case 'StandUpPaddling':
      return SportType.STAND_UP_PADDLING;
    case 'Surfing':
      return SportType.SURFING;
    case 'TableTennis':
      return SportType.TABLE_TENNIS;
    case 'Tennis':
      return SportType.TENNIS;
    case 'Velomobile':
      return SportType.VELOMOBILE;
    case 'VirtualRide':
      return SportType.VIRTUAL_RIDE;
    case 'VirtualRow':
      return SportType.VIRTUAL_ROW;
    case 'VirtualRun':
      return SportType.VIRTUAL_RUN;
    case 'Walk':
      return SportType.WALK;
    case 'WeightTraining':
      return SportType.WEIGHT_TRAINING;
    case 'Wheelchair':
      return SportType.WHEELCHAIR;
    case 'Windsurf':
      return SportType.WINDSURF;
    case 'Workout':
      return SportType.WORKOUT;
    case 'Triathlon':
      return SportType.TRIATHLON;
    case 'Duathlon':
      return SportType.DUATHLON;
    default:
      return SportType.OTHER;
  }
};
