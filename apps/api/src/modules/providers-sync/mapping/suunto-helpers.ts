import { SPORT_TYPE } from '@openathlete/shared';

/**
 * Maps our sport types to Suunto activity IDs
 * Based on Suunto Activities documentation
 * Returns array of activity IDs that the guide is compatible with
 */
export function mapSportToSuuntoActivityIds(sport: SPORT_TYPE): number[] {
  switch (sport) {
    // Running
    case SPORT_TYPE.RUNNING:
    case SPORT_TYPE.VIRTUAL_RUN:
      return [1, 53, 59, 60, 103]; // Running, Treadmill, Track, Orienteering, Track running
    case SPORT_TYPE.TRAIL_RUNNING:
      return [22, 115]; // Trail running, Vertical running

    // Cycling
    case SPORT_TYPE.CYCLING:
    case SPORT_TYPE.VIRTUAL_RIDE:
      return [2, 52, 114]; // Cycling, Indoor cycling, Cyclocross
    case SPORT_TYPE.MOUNTAIN_BIKE_RIDE:
      return [10]; // Mountain biking
    case SPORT_TYPE.GRAVEL_RIDE:
      return [99]; // Gravel cycling
    case SPORT_TYPE.E_BIKE_RIDE:
      return [105]; // E-biking
    case SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE:
      return [106]; // E-mtb
    case SPORT_TYPE.HANDCYCLE:
      return [109]; // Hand cycling

    // Swimming
    case SPORT_TYPE.SWIMMING:
      return [21, 85, 90]; // Swimming, Openwater, Snorkeling

    // Walking & Hiking
    case SPORT_TYPE.WALK:
      return [0, 24]; // Walking, Nordic walking
    case SPORT_TYPE.HIKING:
      return [11, 70]; // Hiking, Trekking

    // Winter Sports
    case SPORT_TYPE.NORDIC_SKI:
      return [3, 56, 107, 117, 118]; // Cross-country, Roller skiing, Backcountry, Skate, Classic
    case SPORT_TYPE.ALPINE_SKI:
      return [13, 84]; // Downhill, Telemark
    case SPORT_TYPE.BACKCOUNTRY_SKI:
      return [31, 116]; // Ski touring, Ski mountaineering
    case SPORT_TYPE.SNOWBOARD:
      return [30, 110]; // Snowboarding, Splitboarding
    case SPORT_TYPE.SNOWSHOE:
      return [65]; // Snow shoeing
    case SPORT_TYPE.ROLLER_SKI:
      return [56]; // Roller skiing

    // Water Sports
    case SPORT_TYPE.CANOEING:
      return [14, 82]; // Paddling, Canoeing
    case SPORT_TYPE.ROWING:
    case SPORT_TYPE.VIRTUAL_ROW:
      return [15, 57]; // Rowing, Indoor rowing
    case SPORT_TYPE.STAND_UP_PADDLING:
      return [61]; // Standup paddling
    case SPORT_TYPE.SAIL:
      return [71]; // Sailing
    case SPORT_TYPE.KAYAKING:
      return [72]; // Kayaking
    case SPORT_TYPE.WINDSURF:
      return [86]; // Windsurfing
    case SPORT_TYPE.KITESURF:
      return [87]; // Kitesurfing
    case SPORT_TYPE.SURFING:
      return [91]; // Surfing

    // Racket Sports
    case SPORT_TYPE.TENNIS:
      return [34]; // Tennis
    case SPORT_TYPE.BADMINTON:
      return [36]; // Badminton
    case SPORT_TYPE.TABLE_TENNIS:
      return [40]; // Table tennis
    case SPORT_TYPE.RACQUETBALL:
      return [41]; // Racquet ball
    case SPORT_TYPE.SQUASH:
      return [42]; // Squash

    // Team Sports
    case SPORT_TYPE.SOCCER:
      return [33]; // Soccer

    // Fitness & Gym
    case SPORT_TYPE.WEIGHT_TRAINING:
    case SPORT_TYPE.STRENGTH:
      return [23, 63, 104]; // Gym, Kettlebell, Calisthenics
    case SPORT_TYPE.YOGA:
      return [51, 121]; // Yoga/pilates, Yoga
    case SPORT_TYPE.PILATES:
      return [120]; // Pilates
    case SPORT_TYPE.CROSSFIT:
    case SPORT_TYPE.HIGH_INTENSITY_INTERVAL_TRAINING:
      return [54]; // Crossfit
    case SPORT_TYPE.ELLIPTICAL:
      return [55]; // Crosstrainer

    // Other Sports
    case SPORT_TYPE.INLINE_SKATE:
      return [12]; // Roller skating
    case SPORT_TYPE.GOLF:
      return [16]; // Golfing
    case SPORT_TYPE.SKATEBOARD:
      return [27]; // Skateboarding
    case SPORT_TYPE.ROCK_CLIMBING:
      return [29, 83]; // Climbing, Mountaineering
    case SPORT_TYPE.ICE_SKATE:
      return [49]; // Ice skating
    case SPORT_TYPE.WHEELCHAIR:
      return [108]; // Wheelchair sport

    // Multisport - use generic activities
    case SPORT_TYPE.TRIATHLON:
    case SPORT_TYPE.DUATHLON:
    case SPORT_TYPE.AQUATHLON:
    case SPORT_TYPE.AQUABIKE:
    case SPORT_TYPE.WORKOUT:
    case SPORT_TYPE.OTHER:
    default:
      // Return empty array - guide will work for all activities
      return [];
  }
}

/**
 * Truncate text to max length
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}

/**
 * Convert pace from m/s to min/km format for display
 */
export function paceMpsToMinPerKm(mps: number): number {
  // 1 m/s = 1000m / (m/s * 60) = min/km
  if (mps <= 0) return 0;
  return 1000 / (mps * 60);
}

/**
 * Convert speed from m/s to km/h
 */
export function speedMpsToKmh(mps: number): number {
  return mps * 3.6;
}
