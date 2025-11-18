import { sport_type } from '@openathlete/database';

/**
 * Maps Strava sport type to our sport type
 * @param type - Strava sport type (AlpineSki, BackcountrySki, Badminton, Canoeing, Crossfit, EBikeRide, Elliptical, EMountainBikeRide, Golf, GravelRide, Handcycle, HighIntensityIntervalTraining, Hike, IceSkate, InlineSkate, Kayaking, Kitesurf, MountainBikeRide, NordicSki, Pickleball, Pilates, Racquetball, Ride, RockClimbing, RollerSki, Rowing, Run, Sail, Skateboard, Snowboard, Snowshoe, Soccer, Squash, StairStepper, StandUpPaddling, Surfing, Swim, TableTennis, Tennis, TrailRun, Velomobile, VirtualRide, VirtualRow, VirtualRun, Walk, WeightTraining, Wheelchair, Windsurf, Workout, Yoga)
 * @returns sport type
 */
export const mapStravaSportType = (type: string): sport_type => {
  switch (type) {
    case 'Run':
      return sport_type.RUNNING;
    case 'TrailRun':
      return sport_type.TRAIL_RUNNING;
    case 'Ride':
      return sport_type.CYCLING;
    case 'Swim':
      return sport_type.SWIMMING;
    case 'RockClimbing':
      return sport_type.ROCK_CLIMBING;
    case 'Hike':
      return sport_type.HIKING;
    case 'Crossfit':
      return sport_type.CROSSFIT;
    case 'Yoga':
      return sport_type.YOGA;
    case 'AlpineSki':
      return sport_type.ALPINE_SKI;
    case 'BackcountrySki':
      return sport_type.BACKCOUNTRY_SKI;
    case 'Badminton':
      return sport_type.BADMINTON;
    case 'Canoeing':
      return sport_type.CANOEING;
    case 'EBikeRide':
      return sport_type.E_BIKE_RIDE;
    case 'Elliptical':
      return sport_type.ELLIPTICAL;
    case 'EMountainBikeRide':
      return sport_type.E_MOUNTAIN_BIKE_RIDE;
    case 'Golf':
      return sport_type.GOLF;
    case 'GravelRide':
      return sport_type.GRAVEL_RIDE;
    case 'Handcycle':
      return sport_type.HANDCYCLE;
    case 'HighIntensityIntervalTraining':
      return sport_type.HIGH_INTENSITY_INTERVAL_TRAINING;
    case 'IceSkate':
      return sport_type.ICE_SKATE;
    case 'InlineSkate':
      return sport_type.INLINE_SKATE;
    case 'Kayaking':
      return sport_type.KAYAKING;
    case 'Kitesurf':
      return sport_type.KITESURF;
    case 'MountainBikeRide':
      return sport_type.MOUNTAIN_BIKE_RIDE;
    case 'NordicSki':
      return sport_type.NORDIC_SKI;
    case 'Pickleball':
      return sport_type.PICKLEBALL;
    case 'Pilates':
      return sport_type.PILATES;
    case 'Racquetball':
      return sport_type.RACQUETBALL;
    case 'RollerSki':
      return sport_type.ROLLER_SKI;
    case 'Rowing':
      return sport_type.ROWING;
    case 'Sail':
      return sport_type.SAIL;
    case 'Skateboard':
      return sport_type.SKATEBOARD;
    case 'Snowboard':
      return sport_type.SNOWBOARD;
    case 'Snowshoe':
      return sport_type.SNOWSHOE;
    case 'Soccer':
      return sport_type.SOCCER;
    case 'Squash':
      return sport_type.SQUASH;
    case 'StairStepper':
      return sport_type.STAIR_STEPPER;
    case 'StandUpPaddling':
      return sport_type.STAND_UP_PADDLING;
    case 'Surfing':
      return sport_type.SURFING;
    case 'TableTennis':
      return sport_type.TABLE_TENNIS;
    case 'Tennis':
      return sport_type.TENNIS;
    case 'Velomobile':
      return sport_type.VELOMOBILE;
    case 'VirtualRide':
      return sport_type.VIRTUAL_RIDE;
    case 'VirtualRow':
      return sport_type.VIRTUAL_ROW;
    case 'VirtualRun':
      return sport_type.VIRTUAL_RUN;
    case 'Walk':
      return sport_type.WALK;
    case 'WeightTraining':
      return sport_type.WEIGHT_TRAINING;
    case 'Wheelchair':
      return sport_type.WHEELCHAIR;
    case 'Windsurf':
      return sport_type.WINDSURF;
    case 'Workout':
      return sport_type.WORKOUT;
    default:
      return sport_type.OTHER;
  }
};
