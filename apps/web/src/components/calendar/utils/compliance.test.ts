import { describe, expect, it } from 'vitest';

import {
  ActivityEvent,
  EVENT_TYPE,
  SPORT_TYPE,
  TrainingEvent,
} from '@openathlete/shared';

import { getCompliance } from './compliance';

// Local dates: run with several TZ values in CI
const MONDAY_MORNING = new Date(2026, 9, 5, 7, 0);
const MONDAY_EVENING = new Date(2026, 9, 5, 21, 0);
const TUESDAY = new Date(2026, 9, 6, 9, 0);

const activity = (fields: Partial<ActivityEvent>) =>
  ({
    eventId: 10,
    type: EVENT_TYPE.ACTIVITY,
    sport: SPORT_TYPE.RUNNING,
    movingTime: 0,
    distance: 0,
    ...fields,
  }) as ActivityEvent;

const training = (fields: Partial<TrainingEvent>) =>
  ({
    eventId: 1,
    type: EVENT_TYPE.TRAINING,
    sport: SPORT_TYPE.RUNNING,
    startDate: MONDAY_MORNING,
    endDate: MONDAY_MORNING,
    goalDuration: null,
    goalDistance: null,
    ...fields,
  }) as TrainingEvent;

describe('compliance of a planned session', () => {
  it('stays pending until its local day is over', () => {
    expect(getCompliance(training({}), MONDAY_EVENING).status).toBe('pending');
    expect(getCompliance(training({}), TUESDAY).status).toBe('missed');
  });

  it('grades the done duration against the planned one', () => {
    const planned = (movingTime: number) =>
      getCompliance(
        training({
          goalDuration: 3600,
          relatedActivity: activity({ movingTime }),
        }),
        TUESDAY,
      );

    expect(planned(3420)).toEqual({
      status: 'complete',
      ratio: 0.95,
      metric: 'duration',
    });
    expect(planned(4320).status).toBe('complete'); // +20%
    expect(planned(2400).status).toBe('partial'); // 67%
    expect(planned(5400).status).toBe('partial'); // 150%
    expect(planned(1200).status).toBe('off'); // 33%
    expect(planned(6000).status).toBe('off'); // 167%
  });

  it('falls back to the distance when no duration was planned', () => {
    const compliance = getCompliance(
      training({
        goalDistance: 10000,
        relatedActivity: activity({ movingTime: 3000, distance: 7000 }),
      }),
      TUESDAY,
    );
    expect(compliance).toEqual({
      status: 'partial',
      ratio: 0.7,
      metric: 'distance',
    });
  });

  it('counts a linked session without goals as complete', () => {
    expect(
      getCompliance(
        training({ relatedActivity: activity({ movingTime: 1800 }) }),
        TUESDAY,
      ),
    ).toEqual({ status: 'complete' });
  });

  it('ignores a goal the activity has no value for', () => {
    // A strength session planned at 5 km (imported plan) and done without GPS
    const compliance = getCompliance(
      training({
        goalDistance: 5000,
        relatedActivity: activity({ movingTime: 1800, distance: 0 }),
      }),
      TUESDAY,
    );
    expect(compliance).toEqual({ status: 'complete' });
  });
});
