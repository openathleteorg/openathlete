import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

export const getHighSaturatedRpeColor = (
  rpe: number,
  border: boolean = true,
) => {
  if (rpe <= 0.2)
    return `bg-green-500 hover:bg-green-600 ${border ? `border-green-700` : ''}`;
  if (rpe <= 0.4)
    return `bg-lime-500 hover:bg-lime-600 ${border ? `border-lime-700` : ''}`;
  if (rpe <= 0.6)
    return `bg-yellow-500 hover:bg-yellow-600 ${border ? `border-yellow-700` : ''}`;
  if (rpe <= 0.8)
    return `bg-orange-500 hover:bg-orange-600 ${border ? `border-orange-700` : ''}`;
  return `bg-red-500 hover:bg-red-600 ${border ? `border-red-700` : ''}`;
};

export const getLowSaturatedRpeColor = (
  rpe: number,
  border: boolean = true,
) => {
  if (rpe <= 0.2)
    return `bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-900 ${border ? `border-green-200 dark:border-green-800/50` : ''}`;
  if (rpe <= 0.4)
    return `bg-lime-100 hover:bg-lime-200 dark:bg-lime-900 dark:hover:bg-lime-900 ${border ? `border-lime-200 dark:border-lime-800/50` : ''}`;
  if (rpe <= 0.6)
    return `bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-900 ${border ? `border-yellow-200 dark:border-yellow-800/50` : ''}`;
  if (rpe <= 0.8)
    return `bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-900 ${border ? `border-orange-200 dark:border-orange-800/50` : ''}`;
  return `bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-900 ${border ? `border-red-200 dark:border-red-800/50` : ''}`;
};

export const getSportColor = (sport: SPORT_TYPE) => {
  switch (sport) {
    case SPORT_TYPE.RUNNING:
      return 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-900 border-green-200 dark:border-green-800/50';
    case SPORT_TYPE.TRAIL_RUNNING:
      return 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-900 border-red-200 dark:border-red-800/50';
    case SPORT_TYPE.CYCLING:
      return 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-900 border-yellow-200 dark:border-yellow-800/50';
    case SPORT_TYPE.SWIMMING:
      return 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800/50';
    case SPORT_TYPE.HIKING:
      return 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-900 border-amber-200 dark:border-amber-800/50';
    case SPORT_TYPE.ROCK_CLIMBING:
      return 'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900 dark:hover:bg-cyan-900 border-cyan-200 dark:border-cyan-800/50';
    case SPORT_TYPE.STRENGTH:
      return 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-900 border-purple-200 dark:border-purple-800/50';
    case SPORT_TYPE.CROSSFIT:
      return 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-900 border-orange-200 dark:border-orange-800/50';
    case SPORT_TYPE.YOGA:
      return 'bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-900 border-pink-200 dark:border-pink-800/50';
    case SPORT_TYPE.ALPINE_SKI:
      return 'bg-sky-100 hover:bg-sky-200 dark:bg-sky-900 dark:hover:bg-sky-900 border-sky-200 dark:border-sky-800/50';
    case SPORT_TYPE.BACKCOUNTRY_SKI:
      return 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-900 border-indigo-200 dark:border-indigo-800/50';
    case SPORT_TYPE.BADMINTON:
      return 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-900 border-emerald-200 dark:border-emerald-800/50';
    case SPORT_TYPE.CANOEING:
      return 'bg-teal-100 hover:bg-teal-200 dark:bg-teal-900 dark:hover:bg-teal-900 border-teal-200 dark:border-teal-800/50';
    case SPORT_TYPE.E_BIKE_RIDE:
      return 'bg-lime-100 hover:bg-lime-200 dark:bg-lime-900 dark:hover:bg-lime-900 border-lime-200 dark:border-lime-800/50';
    case SPORT_TYPE.ELLIPTICAL:
      return 'bg-violet-100 hover:bg-violet-200 dark:bg-violet-900 dark:hover:bg-violet-900 border-violet-200 dark:border-violet-800/50';
    case SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE:
      return 'bg-fuchsia-100 hover:bg-fuchsia-200 dark:bg-fuchsia-900 dark:hover:bg-fuchsia-900 border-fuchsia-200 dark:border-fuchsia-800/50';
    case SPORT_TYPE.GOLF:
      return 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-900 border-green-200 dark:border-green-800/50';
    case SPORT_TYPE.GRAVEL_RIDE:
      return 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-900 border-stone-200 dark:border-stone-800/50';
    case SPORT_TYPE.HANDCYCLE:
      return 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-900 dark:hover:bg-rose-900 border-rose-200 dark:border-rose-800/50';
    case SPORT_TYPE.HIGH_INTENSITY_INTERVAL_TRAINING:
      return 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-900 border-red-200 dark:border-red-800/50';
    case SPORT_TYPE.ICE_SKATE:
      return 'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900 dark:hover:bg-cyan-900 border-cyan-200 dark:border-cyan-800/50';
    case SPORT_TYPE.INLINE_SKATE:
      return 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800/50';
    case SPORT_TYPE.KAYAKING:
      return 'bg-teal-100 hover:bg-teal-200 dark:bg-teal-900 dark:hover:bg-teal-900 border-teal-200 dark:border-teal-800/50';
    case SPORT_TYPE.KITESURF:
      return 'bg-sky-100 hover:bg-sky-200 dark:bg-sky-900 dark:hover:bg-sky-900 border-sky-200 dark:border-sky-800/50';
    case SPORT_TYPE.MOUNTAIN_BIKE_RIDE:
      return 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-900 border-amber-200 dark:border-amber-800/50';
    case SPORT_TYPE.NORDIC_SKI:
      return 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800/50';
    case SPORT_TYPE.PICKLEBALL:
      return 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-900 border-yellow-200 dark:border-yellow-800/50';
    case SPORT_TYPE.PILATES:
      return 'bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-900 border-pink-200 dark:border-pink-800/50';
    case SPORT_TYPE.RACQUETBALL:
      return 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-900 border-orange-200 dark:border-orange-800/50';
    case SPORT_TYPE.ROLLER_SKI:
      return 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800/50';
    case SPORT_TYPE.ROWING:
      return 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-900 border-indigo-200 dark:border-indigo-800/50';
    case SPORT_TYPE.SAIL:
      return 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800/50';
    case SPORT_TYPE.SKATEBOARD:
      return 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800/50';
    case SPORT_TYPE.SNOWBOARD:
      return 'bg-sky-100 hover:bg-sky-200 dark:bg-sky-900 dark:hover:bg-sky-900 border-sky-200 dark:border-sky-800/50';
    case SPORT_TYPE.SNOWSHOE:
      return 'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900 dark:hover:bg-cyan-900 border-cyan-200 dark:border-cyan-800/50';
    case SPORT_TYPE.SOCCER:
      return 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-900 border-emerald-200 dark:border-emerald-800/50';
    case SPORT_TYPE.SQUASH:
      return 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-900 border-orange-200 dark:border-orange-800/50';
    case SPORT_TYPE.STAIR_STEPPER:
      return 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-900 border-purple-200 dark:border-purple-800/50';
    case SPORT_TYPE.STAND_UP_PADDLING:
      return 'bg-teal-100 hover:bg-teal-200 dark:bg-teal-900 dark:hover:bg-teal-900 border-teal-200 dark:border-teal-800/50';
    case SPORT_TYPE.SURFING:
      return 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800/50';
    case SPORT_TYPE.TABLE_TENNIS:
      return 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-900 border-yellow-200 dark:border-yellow-800/50';
    case SPORT_TYPE.TENNIS:
      return 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-900 border-green-200 dark:border-green-800/50';
    case SPORT_TYPE.VELOMOBILE:
      return 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800/50';
    case SPORT_TYPE.VIRTUAL_RIDE:
      return 'bg-violet-100 hover:bg-violet-200 dark:bg-violet-900 dark:hover:bg-violet-900 border-violet-200 dark:border-violet-800/50';
    case SPORT_TYPE.VIRTUAL_ROW:
      return 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-900 border-indigo-200 dark:border-indigo-800/50';
    case SPORT_TYPE.VIRTUAL_RUN:
      return 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-900 border-green-200 dark:border-green-800/50';
    case SPORT_TYPE.WALK:
      return 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-900 border-emerald-200 dark:border-emerald-800/50';
    case SPORT_TYPE.WEIGHT_TRAINING:
      return 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-900 border-purple-200 dark:border-purple-800/50';
    case SPORT_TYPE.WHEELCHAIR:
      return 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800/50';
    case SPORT_TYPE.WINDSURF:
      return 'bg-sky-100 hover:bg-sky-200 dark:bg-sky-900 dark:hover:bg-sky-900 border-sky-200 dark:border-sky-800/50';
    case SPORT_TYPE.WORKOUT:
      return 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800/50';
    case SPORT_TYPE.OTHER:
      return 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800/50';
    default:
      return 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800/50';
  }
};

export const getEventTypeColor = (type: EVENT_TYPE) => {
  switch (type) {
    case 'ACTIVITY':
      return 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-900 border-green-200 dark:border-green-800/50';
    case 'COMPETITION':
      return 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-900 border-red-200 dark:border-red-800/50';
    case 'NOTE':
      return 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-900 border-yellow-200 dark:border-yellow-800/50';
    case 'TRAINING':
      return 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800/50';
  }
};

export const getPainScoreColor = (
  painScore: number,
  border: boolean = true,
) => {
  // painScore is 0-1, similar to RPE
  if (painScore <= 0.2)
    return `bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-900 ${border ? `border-green-200 dark:border-green-800/50` : ''}`;
  if (painScore <= 0.4)
    return `bg-lime-100 hover:bg-lime-200 dark:bg-lime-900 dark:hover:bg-lime-900 ${border ? `border-lime-200 dark:border-lime-800/50` : ''}`;
  if (painScore <= 0.6)
    return `bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-900 ${border ? `border-yellow-200 dark:border-yellow-800/50` : ''}`;
  if (painScore <= 0.8)
    return `bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-900 ${border ? `border-orange-200 dark:border-orange-800/50` : ''}`;
  return `bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-900 ${border ? `border-red-200 dark:border-red-800/50` : ''}`;
};
