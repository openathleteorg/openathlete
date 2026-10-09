import { describe, expect, it } from 'vitest';

import {
  CompetitionEvent,
  EVENT_TYPE,
  Event,
  SPORT_TYPE,
} from '@openathlete/shared';

import { nextRaceCountdown } from './races';

const race = (eventId: number, day: number, priority: 'A' | 'B' | null) =>
  ({
    eventId,
    type: EVENT_TYPE.COMPETITION,
    sport: SPORT_TYPE.RUNNING,
    name: `Race ${eventId}`,
    startDate: new Date(2026, 9, day, 9),
    priority,
  }) as CompetitionEvent;

// Local dates, Monday 5 October 2026 to Sunday 25 October
const WEEK_41 = new Date(2026, 9, 5);
const WEEK_43 = new Date(2026, 9, 19);
const TODAY = new Date(2026, 9, 7);

describe('nextRaceCountdown', () => {
  const events: Event[] = [
    race(1, 18, 'B'),
    race(2, 25, 'A'),
    race(3, 31, 'A'),
  ];

  it('counts the weeks to the next A race', () => {
    expect(nextRaceCountdown(events, WEEK_41, TODAY)).toMatchObject({
      race: { eventId: 2 },
      weeks: 2,
    });
  });

  it("says nothing in the race's own week, after it, or without an A race", () => {
    // The week of the 25th: the next A race is the following week's
    expect(nextRaceCountdown(events, WEEK_43, TODAY)).toMatchObject({
      race: { eventId: 3 },
      weeks: 1,
    });
    expect(nextRaceCountdown([race(2, 25, 'A')], WEEK_43, TODAY)).toBeNull();
    expect(nextRaceCountdown([race(1, 18, 'B')], WEEK_41, TODAY)).toBeNull();
  });

  it('says nothing for past weeks', () => {
    expect(nextRaceCountdown(events, new Date(2026, 8, 28), TODAY)).toBeNull();
  });
});
