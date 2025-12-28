import { SportType } from '@openathlete/database';

/**
 * Maps our sport types to Suunto activity IDs
 * Based on Suunto Activities documentation
 * Returns array of activity IDs that the guide is compatible with
 */
export function mapSportToSuuntoActivityIds(sport: SportType): number[] {
  switch (sport) {
    // Running
    case SportType.RUNNING:
    case SportType.VIRTUAL_RUN:
      return [1, 53, 59, 60, 103]; // Running, Treadmill, Track, Orienteering, Track running
    case SportType.TRAIL_RUNNING:
      return [22, 115]; // Trail running, Vertical running

    // Cycling
    case SportType.CYCLING:
    case SportType.VIRTUAL_RIDE:
      return [2, 52, 114]; // Cycling, Indoor cycling, Cyclocross
    case SportType.MOUNTAIN_BIKE_RIDE:
      return [10]; // Mountain biking
    case SportType.GRAVEL_RIDE:
      return [99]; // Gravel cycling
    case SportType.E_BIKE_RIDE:
      return [105]; // E-biking
    case SportType.E_MOUNTAIN_BIKE_RIDE:
      return [106]; // E-mtb
    case SportType.HANDCYCLE:
      return [109]; // Hand cycling

    // Swimming
    case SportType.SWIMMING:
      return [21, 85, 90]; // Swimming, Openwater, Snorkeling

    // Walking & Hiking
    case SportType.WALK:
      return [0, 24]; // Walking, Nordic walking
    case SportType.HIKING:
      return [11, 70]; // Hiking, Trekking

    // Winter Sports
    case SportType.NORDIC_SKI:
      return [3, 56, 107, 117, 118]; // Cross-country, Roller skiing, Backcountry, Skate, Classic
    case SportType.ALPINE_SKI:
      return [13, 84]; // Downhill, Telemark
    case SportType.BACKCOUNTRY_SKI:
      return [31, 116]; // Ski touring, Ski mountaineering
    case SportType.SNOWBOARD:
      return [30, 110]; // Snowboarding, Splitboarding
    case SportType.SNOWSHOE:
      return [65]; // Snow shoeing
    case SportType.ROLLER_SKI:
      return [56]; // Roller skiing

    // Water Sports
    case SportType.CANOEING:
      return [14, 82]; // Paddling, Canoeing
    case SportType.ROWING:
    case SportType.VIRTUAL_ROW:
      return [15, 57]; // Rowing, Indoor rowing
    case SportType.STAND_UP_PADDLING:
      return [61]; // Standup paddling
    case SportType.SAIL:
      return [71]; // Sailing
    case SportType.KAYAKING:
      return [72]; // Kayaking
    case SportType.WINDSURF:
      return [86]; // Windsurfing
    case SportType.KITESURF:
      return [87]; // Kitesurfing
    case SportType.SURFING:
      return [91]; // Surfing

    // Racket Sports
    case SportType.TENNIS:
      return [34]; // Tennis
    case SportType.BADMINTON:
      return [36]; // Badminton
    case SportType.TABLE_TENNIS:
      return [40]; // Table tennis
    case SportType.RACQUETBALL:
      return [41]; // Racquet ball
    case SportType.SQUASH:
      return [42]; // Squash

    // Team Sports
    case SportType.SOCCER:
      return [33]; // Soccer

    // Fitness & Gym
    case SportType.WEIGHT_TRAINING:
    case SportType.STRENGTH:
      return [23, 63, 104]; // Gym, Kettlebell, Calisthenics
    case SportType.YOGA:
      return [51, 121]; // Yoga/pilates, Yoga
    case SportType.PILATES:
      return [120]; // Pilates
    case SportType.CROSSFIT:
    case SportType.HIGH_INTENSITY_INTERVAL_TRAINING:
      return [54]; // Crossfit
    case SportType.ELLIPTICAL:
      return [55]; // Crosstrainer

    // Other Sports
    case SportType.INLINE_SKATE:
      return [12]; // Roller skating
    case SportType.GOLF:
      return [16]; // Golfing
    case SportType.SKATEBOARD:
      return [27]; // Skateboarding
    case SportType.ROCK_CLIMBING:
      return [29, 83]; // Climbing, Mountaineering
    case SportType.ICE_SKATE:
      return [49]; // Ice skating
    case SportType.WHEELCHAIR:
      return [108]; // Wheelchair sport

    // Multisport - use generic activities
    case SportType.TRIATHLON:
    case SportType.DUATHLON:
    case SportType.AQUATHLON:
    case SportType.AQUABIKE:
    case SportType.WORKOUT:
    case SportType.OTHER:
    default:
      // Return empty array - guide will work for all activities
      return [];
  }
}

/**
 * Sanitize text for Suunto Guide API
 *
 * Removes or replaces characters that can cause issues with the Suunto API:
 * - Quotes (", ', `, «, »)
 * - Backslashes
 * - Control characters
 * - Normalizes Unicode to ASCII equivalents where possible
 */
function sanitizeText(text: string): string {
  return (
    text
      // Replace various quote characters with safe alternatives
      .replace(/[""„‟«»]/g, '') // Remove fancy double quotes
      .replace(/[''‚‛]/g, '') // Remove fancy single quotes
      .replace(/["'`]/g, '') // Remove standard quotes
      // Replace special dashes with regular hyphen
      .replace(/[–—―]/g, '-')
      // Replace ellipsis with dots
      .replace(/…/g, '...')
      // Remove backslashes
      .replace(/\\/g, '')
      // Remove control characters (except newline for text fields)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize multiple spaces to single space
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim()
  );
}

/**
 * Truncate and sanitize text for Suunto Guide API
 *
 * Sanitizes special characters and truncates to max length.
 * Use this for all text fields sent to Suunto (name, description, title, etc.)
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
): string {
  if (!text) return '';
  const sanitized = sanitizeText(text);
  return sanitized.length > maxLength
    ? sanitized.substring(0, maxLength)
    : sanitized;
}
