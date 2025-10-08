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
    return `bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/50 ${border ? `border-green-200 dark:border-green-800/50` : ''}`;
  if (rpe <= 0.4)
    return `bg-lime-50 hover:bg-lime-100 dark:bg-lime-950/40 dark:hover:bg-lime-900/50 ${border ? `border-lime-200 dark:border-lime-800/50` : ''}`;
  if (rpe <= 0.6)
    return `bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:hover:bg-yellow-900/50 ${border ? `border-yellow-200 dark:border-yellow-800/50` : ''}`;
  if (rpe <= 0.8)
    return `bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 ${border ? `border-orange-200 dark:border-orange-800/50` : ''}`;
  return `bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 ${border ? `border-red-200 dark:border-red-800/50` : ''}`;
};

export const getSportColor = (sport: SPORT_TYPE) => {
  switch (sport) {
    case SPORT_TYPE.RUNNING:
      return 'bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800/50';
    case SPORT_TYPE.TRAIL_RUNNING:
      return 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800/50';
    case SPORT_TYPE.CYCLING:
      return 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:hover:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800/50';
    case SPORT_TYPE.SWIMMING:
      return 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800/50';
    case SPORT_TYPE.HIKING:
      return 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800/50';
    case SPORT_TYPE.ROCK_CLIMBING:
      return 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 border-cyan-200 dark:border-cyan-800/50';
    default:
  }
};

export const getEventTypeColor = (type: EVENT_TYPE) => {
  switch (type) {
    case 'ACTIVITY':
      return 'bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800/50';
    case 'COMPETITION':
      return 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800/50';
    case 'NOTE':
      return 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:hover:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800/50';
    case 'TRAINING':
      return 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800/50';
  }
};
