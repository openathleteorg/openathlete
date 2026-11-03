import { ConnectorProvider } from '@openathlete/database';

import {
  ActivitySource,
  SavedActivity,
  activitySource,
  findDuplicateGroups,
  isSameWorkout,
  pickActivityToKeep,
} from './activity-duplicates';

const START = Date.parse('2026-03-01T07:00:00Z');
const MIN = 60_000;

function activity(
  source: ActivitySource,
  startOffsetMin: number,
  elapsedMin: number,
  extra: Partial<SavedActivity> = {},
): SavedActivity {
  const startDate = new Date(START + startOffsetMin * MIN);
  return {
    eventActivityId: Math.round(Math.random() * 1e9),
    source,
    startDate,
    endDate: new Date(startDate.getTime() + elapsedMin * MIN),
    movingTime: null,
    createdAt: new Date('2026-03-01T10:00:00Z'),
    linkedToPlan: false,
    hasConversation: false,
    ...extra,
  };
}

describe('activitySource', () => {
  it('tells providers, uploaded files and hand-logged activities apart', () => {
    expect(
      activitySource({ provider: ConnectorProvider.COROS, externalId: '42' }),
    ).toBe('COROS');
    expect(
      activitySource({ provider: null, externalId: 'fit-manual:1:abc' }),
    ).toBe('FILE');
    expect(
      activitySource({ provider: null, externalId: 'gpx-manual:1:abc' }),
    ).toBe('FILE');
    expect(activitySource({ provider: null, externalId: 'manual-uuid' })).toBe(
      'MANUAL',
    );
  });
});

describe('isSameWorkout', () => {
  it('matches the same run from COROS and Strava', () => {
    expect(
      isSameWorkout(activity('COROS', 0, 60), activity('STRAVA', 1, 62)),
    ).toBe(true);
  });

  it('allows three minutes between the starts, not more', () => {
    expect(
      isSameWorkout(activity('COROS', 0, 60), activity('STRAVA', 3, 60)),
    ).toBe(true);
    expect(
      isSameWorkout(activity('COROS', 0, 60), activity('STRAVA', 3.5, 60)),
    ).toBe(false);
  });

  it('refuses durations more than 20% apart', () => {
    expect(
      isSameWorkout(activity('GARMIN', 0, 60), activity('STRAVA', 0, 48)),
    ).toBe(true);
    expect(
      isSameWorkout(activity('GARMIN', 0, 60), activity('STRAVA', 0, 45)),
    ).toBe(false);
  });

  it('matches on moving time when elapsed times differ, as with a long stop', () => {
    const watch = activity('GARMIN', 0, 90, { movingTime: 60 * 60 });
    const strava = activity('STRAVA', 0, 60, { movingTime: 59 * 60 });
    expect(isSameWorkout(watch, strava)).toBe(true);
  });

  it('never matches two activities of the same source', () => {
    expect(
      isSameWorkout(activity('STRAVA', 0, 60), activity('STRAVA', 0, 60)),
    ).toBe(false);
  });

  it('leaves activities logged by hand alone', () => {
    expect(
      isSameWorkout(activity('MANUAL', 0, 60), activity('GARMIN', 0, 60)),
    ).toBe(false);
  });

  it('needs a duration on both sides', () => {
    expect(isSameWorkout(activity('FILE', 0, 0), activity('POLAR', 0, 0))).toBe(
      false,
    );
  });

  it('ignores the sport, which providers label differently', () => {
    // Nothing about the sport is compared: a trail run on the watch is a run
    // on Strava
    expect(
      isSameWorkout(activity('SUUNTO', -2, 120), activity('STRAVA', 0, 118)),
    ).toBe(true);
  });
});

describe('findDuplicateGroups', () => {
  it('groups the copies of each workout and leaves the others out', () => {
    const morningWatch = activity('COROS', 0, 60);
    const morningStrava = activity('STRAVA', 1, 60);
    const morningFile = activity('FILE', 0, 61);
    const evening = activity('COROS', 600, 45);
    const eveningCommute = activity('STRAVA', 602, 15);

    const groups = findDuplicateGroups([
      evening,
      morningStrava,
      eveningCommute,
      morningWatch,
      morningFile,
    ]);

    expect(groups).toHaveLength(1);
    expect(new Set(groups[0])).toEqual(
      new Set([morningWatch, morningStrava, morningFile]),
    );
  });

  it('finds nothing when every source has its own workouts', () => {
    expect(
      findDuplicateGroups([
        activity('GARMIN', 0, 60),
        activity('STRAVA', 120, 60),
      ]),
    ).toEqual([]);
  });
});

describe('pickActivityToKeep', () => {
  it("keeps the device's recording over Strava's copy", () => {
    const strava = activity('STRAVA', 0, 60, {
      createdAt: new Date('2026-03-01T08:00:00Z'),
    });
    const coros = activity('COROS', 0, 60, {
      createdAt: new Date('2026-03-01T09:00:00Z'),
    });
    expect(pickActivityToKeep([strava, coros])).toBe(coros);
  });

  it('counts an uploaded file as a device recording', () => {
    const strava = activity('STRAVA', 0, 60);
    const file = activity('FILE', 0, 60);
    expect(pickActivityToKeep([strava, file])).toBe(file);
  });

  it('keeps the copy linked to a planned session first', () => {
    const strava = activity('STRAVA', 0, 60, { linkedToPlan: true });
    const garmin = activity('GARMIN', 0, 60);
    expect(pickActivityToKeep([garmin, strava])).toBe(strava);
  });

  it('keeps the commented copy over the linked one, whose link can move', () => {
    const linked = activity('GARMIN', 0, 60, { linkedToPlan: true });
    const commented = activity('STRAVA', 0, 60, { hasConversation: true });
    expect(pickActivityToKeep([linked, commented])).toBe(commented);
  });

  it('keeps the first imported among equals', () => {
    const later = activity('GARMIN', 0, 60, {
      createdAt: new Date('2026-03-02T00:00:00Z'),
    });
    const first = activity('COROS', 0, 60, {
      createdAt: new Date('2026-03-01T00:00:00Z'),
    });
    expect(pickActivityToKeep([later, first])).toBe(first);
  });
});
