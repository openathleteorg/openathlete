import { sport_type } from '@openathlete/database';

/**
 * Maps Garmin activity type to our sport type
 * Based on Garmin Activity API documentation Appendix A
 * @param type - Garmin activity type (e.g., RUNNING, CYCLING, SWIMMING)
 * @returns sport type
 */
export const mapGarminActivityType = (type: string): sport_type => {
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
      return sport_type.RUNNING;

    // Trail Running
    case 'TRAIL_RUNNING':
      return sport_type.TRAIL_RUNNING;

    // Cycling
    case 'CYCLING':
    case 'BMX':
    case 'CYCLOCROSS':
    case 'DOWNHILL_BIKING':
    case 'INDOOR_CYCLING':
    case 'RECUMBENT_CYCLING':
    case 'ROAD_BIKING':
    case 'TRACK_CYCLING':
      return sport_type.CYCLING;

    // E-Bike
    case 'E_BIKE_FITNESS':
      return sport_type.E_BIKE_RIDE;

    // E-Mountain Bike
    case 'E_ENDURO_MTB':
    case 'E_BIKE_MOUNTAIN':
      return sport_type.E_MOUNTAIN_BIKE_RIDE;

    // Gravel
    case 'GRAVEL_CYCLING':
      return sport_type.GRAVEL_RIDE;

    // Mountain Bike
    case 'MOUNTAIN_BIKING':
    case 'ENDURO_MTB':
      return sport_type.MOUNTAIN_BIKE_RIDE;

    // Virtual Ride
    case 'VIRTUAL_RIDE':
      return sport_type.VIRTUAL_RIDE;

    // Handcycle
    case 'HANDCYCLING':
    case 'INDOOR_HANDCYCLING':
      return sport_type.HANDCYCLE;

    // Swimming
    case 'SWIMMING':
    case 'LAP_SWIMMING':
    case 'OPEN_WATER_SWIMMING':
      return sport_type.SWIMMING;

    // Walking/Hiking
    case 'WALKING':
    case 'CASUAL_WALKING':
    case 'SPEED_WALKING':
      return sport_type.WALK;
    case 'HIKING':
    case 'RUCKING':
      return sport_type.HIKING;

    // Winter Sports
    case 'BACKCOUNTRY_SNOWBOARDING':
    case 'BACKCOUNTRY_SKIING':
      return sport_type.BACKCOUNTRY_SKI;
    case 'CROSS_COUNTRY_SKIING_WS':
    case 'SKATE_SKIING_WS':
      return sport_type.NORDIC_SKI;
    case 'RESORT_SKIING':
    case 'RESORT_SKIING_SNOWBOARDING_WS':
      return sport_type.ALPINE_SKI;
    case 'SNOWBOARDING_WS':
      return sport_type.SNOWBOARD;
    case 'SNOW_SHOE_WS':
      return sport_type.SNOWSHOE;
    case 'SKATING_WS':
      return sport_type.ICE_SKATE;

    // Water Sports
    case 'KAYAKING':
    case 'KAYAKING_V2':
      return sport_type.KAYAKING;
    case 'ROWING':
    case 'ROWING_V2':
      return sport_type.ROWING;
    case 'SAILING':
    case 'SAILING_V2':
      return sport_type.SAIL;
    case 'STAND_UP_PADDLEBOARDING':
    case 'STAND_UP_PADDLEBOARDING_V2':
      return sport_type.STAND_UP_PADDLING;
    case 'SURFING':
    case 'SURFING_V2':
      return sport_type.SURFING;
    case 'WINDSURFING':
    case 'WINDSURFING_V2':
      return sport_type.WINDSURF;
    case 'KITEBOARDING':
    case 'KITEBOARDING_V2':
      return sport_type.KITESURF;
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
      return sport_type.CANOEING;

    // Racket Sports
    case 'BADMINTON':
      return sport_type.BADMINTON;
    case 'PICKLEBALL':
      return sport_type.PICKLEBALL;
    case 'RACQUETBALL':
      return sport_type.RACQUETBALL;
    case 'SQUASH':
      return sport_type.SQUASH;
    case 'TABLE_TENNIS':
      return sport_type.TABLE_TENNIS;
    case 'TENNIS':
    case 'TENNIS_V2':
      return sport_type.TENNIS;
    case 'PADDELBALL':
      return sport_type.OTHER; // Padelball not in our enum

    // Team Sports
    case 'SOCCER':
      return sport_type.SOCCER;
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
      return sport_type.OTHER; // Team sports not all in our enum

    // Gym & Fitness
    case 'FITNESS_EQUIPMENT':
    case 'BOULDERING':
    case 'ELLIPTICAL':
      return sport_type.ELLIPTICAL;
    case 'INDOOR_CARDIO':
      return sport_type.OTHER;
    case 'HIIT':
      return sport_type.HIGH_INTENSITY_INTERVAL_TRAINING;
    case 'INDOOR_CLIMBING':
    case 'FLOOR_CLIMBING':
      return sport_type.ROCK_CLIMBING;
    case 'INDOOR_ROWING':
      return sport_type.ROWING;
    case 'MOBILITY':
    case 'PILATES':
      return sport_type.PILATES;
    case 'STAIR_CLIMBING':
      return sport_type.STAIR_STEPPER;
    case 'STRENGTH_TRAINING':
      return sport_type.WEIGHT_TRAINING;
    case 'YOGA':
      return sport_type.YOGA;
    case 'MEDITATION':
    case 'BREATHWORK':
      return sport_type.OTHER;

    // Other
    case 'GOLF':
      return sport_type.GOLF;
    case 'INLINE_SKATING':
      return sport_type.INLINE_SKATE;
    case 'JUMP_ROPE':
    case 'DANCE':
    case 'DISC_GOLF':
    case 'MIXED_MARTIAL_ARTS':
    case 'MOUNTAINEERING':
    case 'ROCK_CLIMBING':
      return sport_type.ROCK_CLIMBING;
    case 'STOP_WATCH':
    case 'BOXING':
    case 'OTHER':
      return sport_type.OTHER;

    // Wheelchair
    case 'WHEELCHAIR_PUSH_RUN':
    case 'WHEELCHAIR_PUSH_WALK':
      return sport_type.WHEELCHAIR;

    // Transitions
    case 'TRANSITION_V2':
    case 'BIKE_TO_RUN_TRANSITION':
    case 'BIKE_TO_RUN_TRANSITION_V2':
    case 'RUN_TO_BIKE_TRANSITION':
    case 'RUN_TO_BIKE_TRANSITION_V2':
    case 'SWIM_TO_BIKE_TRANSITION':
    case 'SWIM_TO_BIKE_TRANSITION_V2':
      return sport_type.OTHER;

    // Multi-sport
    case 'MULTI_SPORT':
      return sport_type.OTHER;

    default:
      return sport_type.OTHER;
  }
};
