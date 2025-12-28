import { SportType } from '@openathlete/database';

/**
 * Maps Garmin activity type to our sport type
 * Based on Garmin Activity API documentation Appendix A
 * @param type - Garmin activity type (e.g., RUNNING, CYCLING, SWIMMING)
 * @returns sport type
 */
export const mapGarminActivityType = (type: string): SportType => {
  switch (type) {
    // Running
    case 'RUNNING':
    case 'INDOOR_RUNNING':
    case 'STREET_RUNNING':
    case 'TRACK_RUNNING':
    case 'TREADMILL_RUNNING':
    case 'OBSTACLE_RUN':
    case 'ULTRA_RUN':
    case 'VIRTUAL_RUN':
      return SportType.RUNNING;

    // Trail Running
    case 'TRAIL_RUNNING':
      return SportType.TRAIL_RUNNING;

    // Cycling
    case 'CYCLING':
    case 'BMX':
    case 'CYCLOCROSS':
    case 'DOWNHILL_BIKING':
    case 'INDOOR_CYCLING':
    case 'RECUMBENT_CYCLING':
    case 'ROAD_BIKING':
    case 'TRACK_CYCLING':
      return SportType.CYCLING;

    // E-Bike
    case 'E_BIKE_FITNESS':
      return SportType.E_BIKE_RIDE;

    // E-Mountain Bike
    case 'E_ENDURO_MTB':
    case 'E_BIKE_MOUNTAIN':
      return SportType.E_MOUNTAIN_BIKE_RIDE;

    // Gravel
    case 'GRAVEL_CYCLING':
      return SportType.GRAVEL_RIDE;

    // Mountain Bike
    case 'MOUNTAIN_BIKING':
    case 'ENDURO_MTB':
      return SportType.MOUNTAIN_BIKE_RIDE;

    // Virtual Ride
    case 'VIRTUAL_RIDE':
      return SportType.VIRTUAL_RIDE;

    // Handcycle
    case 'HANDCYCLING':
    case 'INDOOR_HANDCYCLING':
      return SportType.HANDCYCLE;

    // Swimming
    case 'SWIMMING':
    case 'LAP_SWIMMING':
    case 'OPEN_WATER_SWIMMING':
      return SportType.SWIMMING;

    // Walking/Hiking
    case 'WALKING':
    case 'CASUAL_WALKING':
    case 'SPEED_WALKING':
      return SportType.WALK;
    case 'HIKING':
    case 'RUCKING':
      return SportType.HIKING;

    // Winter Sports
    case 'BACKCOUNTRY_SNOWBOARDING':
    case 'BACKCOUNTRY_SKIING':
      return SportType.BACKCOUNTRY_SKI;
    case 'CROSS_COUNTRY_SKIING_WS':
    case 'SKATE_SKIING_WS':
      return SportType.NORDIC_SKI;
    case 'RESORT_SKIING':
    case 'RESORT_SKIING_SNOWBOARDING_WS':
      return SportType.ALPINE_SKI;
    case 'SNOWBOARDING_WS':
      return SportType.SNOWBOARD;
    case 'SNOW_SHOE_WS':
      return SportType.SNOWSHOE;
    case 'SKATING_WS':
      return SportType.ICE_SKATE;

    // Water Sports
    case 'KAYAKING':
    case 'KAYAKING_V2':
      return SportType.KAYAKING;
    case 'ROWING':
    case 'ROWING_V2':
      return SportType.ROWING;
    case 'SAILING':
    case 'SAILING_V2':
      return SportType.SAIL;
    case 'STAND_UP_PADDLEBOARDING':
    case 'STAND_UP_PADDLEBOARDING_V2':
      return SportType.STAND_UP_PADDLING;
    case 'SURFING':
    case 'SURFING_V2':
      return SportType.SURFING;
    case 'WINDSURFING':
    case 'WINDSURFING_V2':
      return SportType.WINDSURF;
    case 'KITEBOARDING':
    case 'KITEBOARDING_V2':
      return SportType.KITESURF;
    case 'BOATING':
    case 'BOATING_V2':
    case 'FISHING':
    case 'FISHING_V2':
    case 'PADDLING':
    case 'PADDLING_V2':
    case 'SNORKELING':
    case 'WATERSKIING':
    case 'WHITEWATER_RAFTING':
    case 'WHITEWATER_RAFTING_V2':
      return SportType.CANOEING;

    // Racket Sports
    case 'BADMINTON':
      return SportType.BADMINTON;
    case 'PICKLEBALL':
      return SportType.PICKLEBALL;
    case 'RACQUETBALL':
      return SportType.RACQUETBALL;
    case 'SQUASH':
      return SportType.SQUASH;
    case 'TABLE_TENNIS':
      return SportType.TABLE_TENNIS;
    case 'TENNIS':
    case 'TENNIS_V2':
      return SportType.TENNIS;
    case 'PADDELBALL':
      return SportType.OTHER; // Padelball not in our enum

    // Team Sports
    case 'SOCCER':
      return SportType.SOCCER;
    case 'AMERICAN_FOOTBALL':
    case 'BASEBALL':
    case 'BASKETBALL':
    case 'CRICKET':
    case 'FIELD_HOCKEY':
    case 'ICE_HOCKEY':
    case 'LACROSSE':
    case 'RUGBY':
    case 'SOFTBALL':
    case 'ULTIMATE_DISC':
    case 'VOLLEYBALL':
      return SportType.OTHER; // Team sports not all in our enum

    // Gym & Fitness
    case 'FITNESS_EQUIPMENT':
    case 'BOULDERING':
    case 'ELLIPTICAL':
      return SportType.ELLIPTICAL;
    case 'INDOOR_CARDIO':
      return SportType.OTHER;
    case 'HIIT':
      return SportType.HIGH_INTENSITY_INTERVAL_TRAINING;
    case 'INDOOR_CLIMBING':
    case 'FLOOR_CLIMBING':
      return SportType.ROCK_CLIMBING;
    case 'INDOOR_ROWING':
      return SportType.ROWING;
    case 'MOBILITY':
    case 'PILATES':
      return SportType.PILATES;
    case 'STAIR_CLIMBING':
      return SportType.STAIR_STEPPER;
    case 'STRENGTH_TRAINING':
      return SportType.WEIGHT_TRAINING;
    case 'YOGA':
      return SportType.YOGA;
    case 'MEDITATION':
    case 'BREATHWORK':
      return SportType.OTHER;

    // Other
    case 'GOLF':
      return SportType.GOLF;
    case 'INLINE_SKATING':
      return SportType.INLINE_SKATE;
    case 'JUMP_ROPE':
    case 'DANCE':
    case 'DISC_GOLF':
    case 'MIXED_MARTIAL_ARTS':
    case 'MOUNTAINEERING':
    case 'ROCK_CLIMBING':
      return SportType.ROCK_CLIMBING;
    case 'STOP_WATCH':
    case 'BOXING':
    case 'OTHER':
      return SportType.OTHER;

    // Wheelchair
    case 'WHEELCHAIR_PUSH_RUN':
    case 'WHEELCHAIR_PUSH_WALK':
      return SportType.WHEELCHAIR;

    // Transitions
    case 'TRANSITION_V2':
    case 'BIKE_TO_RUN_TRANSITION':
    case 'BIKE_TO_RUN_TRANSITION_V2':
    case 'RUN_TO_BIKE_TRANSITION':
    case 'RUN_TO_BIKE_TRANSITION_V2':
    case 'SWIM_TO_BIKE_TRANSITION':
    case 'SWIM_TO_BIKE_TRANSITION_V2':
      return SportType.OTHER;

    // Multi-sport
    case 'MULTI_SPORT':
      return SportType.OTHER;

    default:
      return SportType.OTHER;
  }
};
