import { COMPETITION_PRIORITY, EVENT_TYPE, SPORT_TYPE } from '../../misc';

/**
 * A session, race or activity as the season view needs it: when, how long
 * and how far, planned or done. A few fields instead of the whole event, so
 * a year of them stays a small response.
 */
export type SeasonEvent = {
  eventId: number;
  type: EVENT_TYPE.TRAINING | EVENT_TYPE.COMPETITION | EVENT_TYPE.ACTIVITY;
  name: string;
  startDate: Date;
  sport: SPORT_TYPE;
  /** Planned sessions and races: their goals */
  plannedSeconds: number | null;
  plannedMeters: number | null;
  /** Activities: what was recorded */
  doneSeconds: number | null;
  doneMeters: number | null;
  /** Planned sessions and races: an activity is linked */
  done: boolean;
  priority: COMPETITION_PRIORITY | null;
};
