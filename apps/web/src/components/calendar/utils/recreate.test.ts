import { describe, expect, it } from 'vitest';

import {
  ActivityEvent,
  EVENT_TYPE,
  NoteEvent,
  SPORT_TYPE,
  TrainingEvent,
} from '@openathlete/shared';

import { toRecreateDto } from './recreate';

const start = new Date(2026, 9, 6, 18);
const end = new Date(2026, 9, 6, 19);

describe('toRecreateDto', () => {
  it('re-creates a session with its goals and workout', () => {
    const dto = toRecreateDto({
      eventId: 1,
      type: EVENT_TYPE.TRAINING,
      name: 'Tempo',
      sport: SPORT_TYPE.RUNNING,
      description: 'Steady',
      startDate: start,
      endDate: end,
      athleteId: 2,
      goalDistance: 10000,
      goalDuration: 3600,
      goalElevationGain: null,
      goalRpe: 0.6,
      workout: {
        steps: [
          {
            workoutStepId: 9,
            orderIndex: 0,
            stepType: 'WARMUP',
            durationType: 'TIME',
            durationValue: 600,
            targets: [],
          },
        ],
      },
    } as unknown as TrainingEvent);

    expect(dto).toMatchObject({
      type: EVENT_TYPE.TRAINING,
      name: 'Tempo',
      athleteId: 2,
      startDate: start,
      goalDuration: 3600,
      goalRpe: 0.6,
    });
    expect(dto && 'workout' in dto && dto.workout?.steps).toHaveLength(1);
  });

  it('keeps a note readable, and never re-creates an activity', () => {
    expect(
      toRecreateDto({
        eventId: 2,
        type: EVENT_TYPE.NOTE,
        name: 'Travel',
        description: '',
        startDate: start,
        endDate: end,
        athleteId: 2,
      } as unknown as NoteEvent),
    ).toMatchObject({ type: EVENT_TYPE.NOTE, description: 'Travel' });
    expect(
      toRecreateDto({ type: EVENT_TYPE.ACTIVITY } as unknown as ActivityEvent),
    ).toBeNull();
  });
});
