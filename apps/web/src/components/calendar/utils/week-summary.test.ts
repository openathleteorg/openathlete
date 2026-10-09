import { describe, expect, it } from 'vitest';

import {
  ActivityEvent,
  CompetitionEvent,
  EVENT_TYPE,
  Event,
  NoteEvent,
  SPORT_TYPE,
  TrainingEvent,
} from '@openathlete/shared';

import {
  formatCompactDuration,
  formatCompactKilometers,
  progressOf,
  summarizeWeek,
} from './week-summary';

const NOW = new Date(2026, 9, 7, 12, 0); // Wednesday

const activity = (eventId: number, fields: Partial<ActivityEvent>) =>
  ({
    eventId,
    type: EVENT_TYPE.ACTIVITY,
    sport: SPORT_TYPE.RUNNING,
    movingTime: 0,
    distance: 0,
    elevationGain: 0,
    ...fields,
  }) as ActivityEvent;

const planned = (
  eventId: number,
  day: number,
  fields: Partial<TrainingEvent> = {},
) =>
  ({
    eventId,
    type: EVENT_TYPE.TRAINING,
    sport: SPORT_TYPE.RUNNING,
    startDate: new Date(2026, 9, day, 7),
    goalDuration: null,
    goalDistance: null,
    goalElevationGain: null,
    ...fields,
  }) as TrainingEvent;

describe('summarizeWeek', () => {
  it('puts planned and done side by side, never adding them up', () => {
    const run = activity(10, {
      movingTime: 3300,
      distance: 10500,
      elevationGain: 80,
    });
    const events: Event[] = [
      run,
      planned(1, 5, {
        goalDuration: 3600,
        goalDistance: 10000,
        relatedActivity: run,
      }),
      planned(2, 6, { goalDuration: 2700 }), // missed
      planned(3, 9, { goalDuration: 5400, goalElevationGain: 300 }),
      {
        eventId: 4,
        type: EVENT_TYPE.COMPETITION,
        sport: SPORT_TYPE.RUNNING,
        startDate: new Date(2026, 9, 11, 9),
        goalDuration: 5400,
        goalDistance: 21097,
        goalElevationGain: null,
      } as CompetitionEvent,
      activity(11, { movingTime: 1800, distance: 5000 }), // off-plan
      { eventId: 5, type: EVENT_TYPE.NOTE } as NoteEvent,
    ];

    expect(summarizeWeek(events, NOW)).toEqual({
      duration: { planned: 3600 + 2700 + 5400 + 5400, done: 3300 + 1800 },
      distance: { planned: 10000 + 21097, done: 10500 + 5000 },
      elevation: { planned: 300, done: 80 },
      sessions: { done: 1, missed: 1, pending: 2 },
    });
  });

  it('gives no progress when nothing was planned', () => {
    expect(progressOf({ planned: 0, done: 3600 })).toBeNull();
    expect(progressOf({ planned: 7200, done: 3600 })).toBe(0.5);
  });
});

describe('compact formats', () => {
  it('writes durations in hours and minutes', () => {
    expect(formatCompactDuration(45 * 60)).toBe('45min');
    expect(formatCompactDuration(3600)).toBe('1h');
    expect(formatCompactDuration(4 * 3600 + 5 * 60 + 20)).toBe('4h05');
  });

  it('writes kilometres without needless decimals, in the locale', () => {
    expect(formatCompactKilometers(93_000, 'en')).toBe('93');
    expect(formatCompactKilometers(93_400, 'en')).toBe('93');
    expect(formatCompactKilometers(9_500, 'en')).toBe('9.5');
    expect(formatCompactKilometers(9_500, 'fr')).toBe('9,5');
    expect(formatCompactKilometers(8_000, 'en')).toBe('8');
  });
});
