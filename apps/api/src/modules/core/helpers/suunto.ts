import { SportType } from '@openathlete/database';

/**
 * Maps Suunto activity ID to our sport type
 * Based on Suunto Activities documentation
 * @param activityId - Suunto activity ID (number)
 * @returns sport type
 */
export const mapSuuntoActivityId = (activityId: number): SportType => {
  switch (activityId) {
    // Walking & Hiking
    case 0: // Walking
    case 24: // Nordic walking
      return SportType.WALK;
    case 11: // Hiking
    case 70: // Trekking
      return SportType.HIKING;

    // Running
    case 1: // Running
    case 53: // Treadmill
    case 59: // Track and field
    case 60: // Orienteering
    case 103: // Track running
      return SportType.RUNNING;
    case 22: // Trail running
    case 115: // Vertical running
      return SportType.TRAIL_RUNNING;

    // Cycling
    case 2: // Cycling
    case 52: // Indoor cycling
    case 114: // Cyclocross
      return SportType.CYCLING;
    case 10: // Mountain biking
      return SportType.MOUNTAIN_BIKE_RIDE;
    case 99: // Gravel cycling
      return SportType.GRAVEL_RIDE;
    case 105: // E-biking
      return SportType.E_BIKE_RIDE;
    case 106: // E-mtb
      return SportType.E_MOUNTAIN_BIKE_RIDE;
    case 109: // Hand cycling
      return SportType.HANDCYCLE;

    // Swimming
    case 21: // Swimming
    case 85: // Openwater swimming
    case 90: // Snorkeling
      return SportType.SWIMMING;

    // Winter Sports
    case 3: // Cross-country skiing
    case 56: // Roller skiing
    case 107: // Backcountry skiing
    case 117: // Skate skiing
    case 118: // Classic skiing
      return SportType.NORDIC_SKI;
    case 13: // Downhill skiing
    case 84: // Telemarkskiing
      return SportType.ALPINE_SKI;
    case 31: // Ski touring
    case 116: // Ski mountaineering
      return SportType.BACKCOUNTRY_SKI;
    case 30: // Snowboarding
    case 110: // Splitboarding
      return SportType.SNOWBOARD;
    case 65: // Snow shoeing
      return SportType.SNOWSHOE;

    // Water Sports
    case 14: // Paddling
    case 82: // Canoeing
      return SportType.CANOEING;
    case 15: // Rowing
    case 57: // Indoor rowing
      return SportType.ROWING;
    case 61: // Standup paddling
      return SportType.STAND_UP_PADDLING;
    case 71: // Sailing
      return SportType.SAIL;
    case 72: // Kayaking
      return SportType.KAYAKING;
    case 86: // Windsurfing
      return SportType.WINDSURF;
    case 87: // Kitesurfing
      return SportType.KITESURF;
    case 91: // Surfing
      return SportType.SURFING;

    // Racket Sports
    case 34: // Tennis
      return SportType.TENNIS;
    case 36: // Badminton
      return SportType.BADMINTON;
    case 40: // Table tennis
      return SportType.TABLE_TENNIS;
    case 41: // Racquet ball
      return SportType.RACQUETBALL;
    case 42: // Squash
      return SportType.SQUASH;

    // Team Sports
    case 33: // Soccer
      return SportType.SOCCER;

    // Fitness & Gym
    case 23: // Gym
    case 63: // Kettlebell
    case 104: // Calisthenics
      return SportType.WEIGHT_TRAINING;
    case 51: // Yoga/pilates
    case 121: // Yoga
      return SportType.YOGA;
    case 120: // Pilates
      return SportType.PILATES;
    case 54: // Crossfit
      return SportType.CROSSFIT;
    case 55: // Crosstrainer
      return SportType.ELLIPTICAL;

    // Other Sports
    case 12: // Roller skating
      return SportType.INLINE_SKATE;
    case 16: // Golfing
      return SportType.GOLF;
    case 27: // Skateboarding
      return SportType.SKATEBOARD;
    case 29: // Climbing
    case 83: // Mountaineering
      return SportType.ROCK_CLIMBING;
    case 49: // Ice skating
      return SportType.ICE_SKATE;
    case 62: // Combat sport
      return SportType.MARTIAL_ARTS;
    case 108: // Wheelchair sport
      return SportType.WHEELCHAIR;

    // Multisport
    case 68: // Multisport
      return SportType.OTHER;
    case 74: // Triathlon
      return SportType.TRIATHLON;
    case 92: // Swimrun
      return SportType.OTHER;
    case 93: // Duathlon
      return SportType.DUATHLON;
    case 94: // Aquathlon
      return SportType.AQUATHLON;
    case 111: // Biathlon
      return SportType.OTHER;

    // Generic/Other
    case 4: // Sports (generic)
    case 5: // Sports (generic)
    case 6: // Sports (generic)
    case 7: // Sports (generic)
    case 8: // Sports (generic)
    case 9: // Sports (generic)
    case 17: // Indoor sports
    case 18: // Parkouring
    case 19: // Ball games
    case 20: // Outdoor gym
    case 25: // Horseback riding
    case 26: // Motorsports
    case 28: // Water sports
    case 32: // Fitness class
    case 35: // Basketball
    case 37: // Baseball
    case 38: // Volleyball
    case 39: // American football
    case 43: // Floorball
    case 44: // Handball
    case 45: // Softball
    case 46: // Bowling
    case 47: // Cricket
    case 48: // Rugby
    case 50: // Ice hockey
    case 58: // Stretching
    case 64: // Dancing
    case 66: // Frisbee golf
    case 67: // Futsal
    case 69: // Aerobics
    case 73: // Circuit training
    case 75: // Padel
    case 76: // Cheerleading
    case 77: // Boxing
    case 78: // Scubadiving
    case 79: // Freediving
    case 80: // Adventure racing
    case 81: // Gymnastics
    case 88: // Paragliding
    case 89: // (not used)
    case 95: // Obstacle racing
    case 96: // Fishing
    case 97: // Hunting
    case 98: // Transition
    case 100: // Mermaiding
    case 101: // Spearfishing
    case 102: // Jump rope
    case 112: // Meditation
    case 113: // Field hockey
    case 119: // Chores
      return SportType.OTHER;

    default:
      return SportType.OTHER;
  }
};

/**
 * Maps Suunto workout data to sport type based on available fields
 * Priority: activityId > extensionTypes > workoutName
 */
/**
 * Names of Suunto's sports as the Suunto app shows them, by activity id.
 * Source: Suunto API Zone, "Supported sport types"
 * (https://aspartnercontent.blob.core.windows.net/apizone/docs/Activities.pdf),
 * linked from the Workout API description.
 */
const SUUNTO_ACTIVITY_NAMES: Record<number, string> = {
  0: 'Walking',
  1: 'Running',
  2: 'Cycling',
  3: 'Cross-country skiing',
  4: 'Sports',
  5: 'Sports',
  6: 'Sports',
  7: 'Sports',
  8: 'Sports',
  9: 'Sports',
  10: 'Mountain biking',
  11: 'Hiking',
  12: 'Roller skating',
  13: 'Downhill skiing',
  14: 'Paddling',
  15: 'Rowing',
  16: 'Golfing',
  17: 'Indoor sports',
  18: 'Parkouring',
  19: 'Ball games',
  20: 'Outdoor gym',
  21: 'Swimming',
  22: 'Trail running',
  23: 'Gym',
  24: 'Nordic walking',
  25: 'Horseback riding',
  26: 'Motorsports',
  27: 'Skateboarding',
  28: 'Water sports',
  29: 'Climbing',
  30: 'Snowboarding',
  31: 'Ski touring',
  32: 'Fitness class',
  33: 'Soccer',
  34: 'Tennis',
  35: 'Basketball',
  36: 'Badminton',
  37: 'Baseball',
  38: 'Volleyball',
  39: 'American football',
  40: 'Table tennis',
  41: 'Racquet ball',
  42: 'Squash',
  43: 'Floorball',
  44: 'Handball',
  45: 'Softball',
  46: 'Bowling',
  47: 'Cricket',
  48: 'Rugby',
  49: 'Ice skating',
  50: 'Ice hockey',
  51: 'Yoga/pilates',
  52: 'Indoor cycling',
  53: 'Treadmill',
  54: 'Crossfit',
  55: 'Crosstrainer',
  56: 'Roller skiing',
  57: 'Indoor rowing',
  58: 'Stretching',
  59: 'Track and field',
  60: 'Orienteering',
  61: 'Standup paddling',
  62: 'Combat sport',
  63: 'Kettlebell',
  64: 'Dancing',
  65: 'Snow shoeing',
  66: 'Frisbee golf',
  67: 'Futsal',
  68: 'Multisport',
  69: 'Aerobics',
  70: 'Trekking',
  71: 'Sailing',
  72: 'Kayaking',
  73: 'Circuit training',
  74: 'Triathlon',
  75: 'Padel',
  76: 'Cheerleading',
  77: 'Boxing',
  78: 'Scubadiving',
  79: 'Freediving',
  80: 'Adventure racing',
  81: 'Gymnastics',
  82: 'Canoeing',
  83: 'Mountaineering',
  84: 'Telemarkskiing',
  85: 'Openwater swimming',
  86: 'Windsurfing',
  87: 'Kitesurfing',
  88: 'Paragliding',
  90: 'Snorkeling',
  91: 'Surfing',
  92: 'Swimrun',
  93: 'Duathlon',
  94: 'Aquathlon',
  95: 'Obstacle racing',
  96: 'Fishing',
  97: 'Hunting',
  98: 'Transition',
  99: 'Gravel cycling',
  100: 'Mermaiding',
  101: 'Spearfishing',
  102: 'Jump rope',
  103: 'Track running',
  104: 'Calisthenics',
  105: 'E-biking',
  106: 'E-mtb',
  107: 'Backcountry skiing',
  108: 'Wheelchair sport',
  109: 'Hand cycling',
  110: 'Splitboarding',
  111: 'Biathlon',
  112: 'Meditation',
  113: 'Field hockey',
  114: 'Cyclocross',
  115: 'Vertical running',
  116: 'Ski mountaineering',
  117: 'Skate skiing',
  118: 'Classic skiing',
  119: 'Chores',
  120: 'Pilates',
  121: 'Yoga',
};

/** The name we gave Suunto workouts before reading their sport */
const GENERATED_NAME = /^Suunto Workout [0-9a-f]+$/;

/** Whether an activity still has the name we generated from its key */
export const isGeneratedSuuntoName = (name: string) =>
  GENERATED_NAME.test(name);

/**
 * A workout's name: the one the athlete gave it in the Suunto app, else its
 * sport as Suunto names it ("Indoor cycling", "Gym"), as the app does. The
 * API leaves `workoutName` empty for most workouts.
 */
export const suuntoWorkoutName = (workout: {
  workoutName?: string | null;
  activityId?: number;
}): string =>
  workout.workoutName?.trim() ||
  (workout.activityId !== undefined
    ? SUUNTO_ACTIVITY_NAMES[workout.activityId]
    : undefined) ||
  'Suunto activity';

export const mapSuuntoWorkoutToSportType = (workout: {
  activityId?: number;
  workoutName?: string;
  extensionTypes?: string[];
}): SportType => {
  // First, try to use activityId if available (most reliable)
  if (workout.activityId !== undefined) {
    return mapSuuntoActivityId(workout.activityId);
  }

  // Try to infer from extension types
  if (workout.extensionTypes) {
    if (workout.extensionTypes.includes('SWIMMINGHEADER')) {
      return SportType.SWIMMING;
    }
    if (workout.extensionTypes.includes('SKIHEADER')) {
      return SportType.ALPINE_SKI;
    }
    if (workout.extensionTypes.includes('SKITURN')) {
      return SportType.ALPINE_SKI;
    }
  }

  // Fallback: try to infer from workout name
  if (workout.workoutName) {
    const name = workout.workoutName.toLowerCase();
    if (name.includes('run') || name.includes('course')) {
      if (name.includes('trail')) {
        return SportType.TRAIL_RUNNING;
      }
      return SportType.RUNNING;
    }
    if (
      name.includes('bike') ||
      name.includes('vélo') ||
      name.includes('cycling')
    ) {
      if (name.includes('mountain') || name.includes('vtt')) {
        return SportType.MOUNTAIN_BIKE_RIDE;
      }
      if (name.includes('gravel')) {
        return SportType.GRAVEL_RIDE;
      }
      return SportType.CYCLING;
    }
    if (name.includes('swim') || name.includes('nage')) {
      return SportType.SWIMMING;
    }
    if (name.includes('hike') || name.includes('randonnée')) {
      return SportType.HIKING;
    }
  }

  // Default fallback
  return SportType.OTHER;
};
