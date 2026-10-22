import {
  ImportHealthkitWorkoutDto,
  importHealthkitWorkoutDtoSchema,
} from '@openathlete/shared';

import {
  enrichRecordingStream,
  healthkitRecording,
  recordingMatch,
} from './activity-recording';

const workout = (): ImportHealthkitWorkoutDto => ({
  protocolVersion: 1,
  workoutUuid: '11111111-1111-4111-8111-111111111111',
  revision: 1,
  name: 'Watch run',
  sport: 'RUNNING' as ImportHealthkitWorkoutDto['sport'],
  startDate: '2026-10-20T08:00:00Z',
  endDate: '2026-10-20T09:00:00Z',
  elapsedDuration: { value: 3600, unit: 's' },
  distance: { value: 10000, unit: 'm' },
  source: {
    bundleIdentifier: 'com.apple.health',
    name: 'Apple Watch',
    original: true,
    recordingKind: 'single',
  },
});

describe('HealthKit workout validation and recording matching', () => {
  it('uses recorded pauses when active duration is unavailable', () => {
    const value = workout();
    value.events = [
      { type: 'PAUSE', timestamp: '2026-10-20T08:20:00Z' },
      { type: 'RESUME', timestamp: '2026-10-20T08:25:00Z' },
      { type: 'PAUSE', timestamp: '2026-10-20T08:50:00Z' },
    ];
    expect(healthkitRecording(value).values.movingTime).toBe(2700);
  });
  it('accepts explicit units, offsets and absent channels without inventing sensor zeros', () => {
    const parsed = importHealthkitWorkoutDtoSchema.parse(workout());
    const recording = healthkitRecording(parsed);
    expect(recording.stream).toEqual({});
    expect(recording.values.averageHeartrate).toBeUndefined();
    expect(parsed.distance?.value).toBe(10000);
  });

  it.each([
    { athleteId: 123 },
    { elapsedDuration: { value: 3600, unit: 'h' } },
    { endDate: '2026-10-20T07:00:00Z' },
    { startDate: '2026-10-20T08:00:00' },
    { elapsedDuration: { value: 120, unit: 's' } },
    { revision: 0 },
    { activeDuration: { value: 3601, unit: 's' } },
    { sport: 'TRIATHLON' },
    { distance: { value: Infinity, unit: 'm' } },
    {
      streams: {
        heartrate: {
          unit: 'bpm',
          samples: [{ timestamp: '2026-10-20T07:00:00Z', value: 100 }],
        },
      },
    },
    {
      streams: {
        heartrate: {
          unit: 'bpm',
          samples: [
            { timestamp: '2026-10-20T08:00:01Z', value: 100 },
            { timestamp: '2026-10-20T08:00:01Z', value: 101 },
          ],
        },
      },
    },
    { events: [{ type: 'RESUME', timestamp: '2026-10-20T08:10:00Z' }] },
    {
      laps: [
        { startDate: '2026-10-20T08:01:00Z', endDate: '2026-10-20T09:01:00Z' },
      ],
    },
  ])('rejects invalid or ambiguous input %j', (patch) => {
    expect(
      importHealthkitWorkoutDtoSchema.safeParse({ ...workout(), ...patch })
        .success,
    ).toBe(false);
  });

  it('rejects more than the total sample budget across otherwise bounded channels', () => {
    const samples = Array.from({ length: 50001 }, (_, i) => ({
      timestamp: new Date(
        Date.parse('2026-10-20T08:00:00Z') + i * 10,
      ).toISOString(),
      value: i,
    }));
    expect(
      importHealthkitWorkoutDtoSchema.safeParse({
        ...workout(),
        streams: {
          watts: { unit: 'W', samples },
          cadence: { unit: 'rpm', samples },
        },
      }).success,
    ).toBe(false);
  });

  it('handles UTC instants across a daylight-saving transition', () => {
    expect(
      importHealthkitWorkoutDtoSchema.safeParse({
        ...workout(),
        startDate: '2026-10-25T02:30:00+02:00',
        endDate: '2026-10-25T02:30:00+01:00',
      }).success,
    ).toBe(true);
  });

  it('aligns independent channels at exact UTC timestamps and preserves GPS gaps', () => {
    const result = enrichRecordingStream(
      { time: [0, 1, 2], watts: [100, 101, 102] },
      {
        time: [10, 11, 12],
        heartrate: [120, 121, 122],
        latlng: [[50, 8], [], [50.1, 8.1]],
      },
      '2026-10-20T08:00:10Z',
      '2026-10-20T08:00:00Z',
    );
    expect(result.heartrate).toEqual([120, 121, 122]);
    expect(result.latlng?.[1]).toEqual([]);
    const partial = enrichRecordingStream(
      { time: [0, 1, 2] },
      { time: [0, 2], heartrate: [120, 122] },
      workout().startDate,
      workout().startDate,
    );
    expect(partial.heartrate).toBeUndefined();
  });

  it('keeps asynchronous original channels in raw data without fabricating alignment', () => {
    const value = workout();
    value.streams = {
      watts: {
        unit: 'W',
        samples: [0, 1, 2].map((i) => ({
          timestamp: new Date(
            Date.parse(value.startDate) + i * 1000,
          ).toISOString(),
          value: 200 + i,
        })),
      },
      heartrate: {
        unit: 'bpm',
        samples: [{ timestamp: value.startDate, value: 120 }],
      },
    };
    const result = healthkitRecording(value);
    expect(result.stream.time).toEqual([0, 1, 2]);
    expect(result.stream.watts).toEqual([200, 201, 202]);
    expect(result.stream.heartrate).toBeUndefined();
    expect(result.raw).toBe(value);
  });

  it('distinguishes complete mirrors, partial recordings, different sports and back-to-back sessions', () => {
    const a = healthkitRecording(workout());
    expect(
      recordingMatch(a, {
        ...a,
        startDate: '2026-10-20T08:00:04Z',
        endDate: '2026-10-20T09:00:04Z',
      }),
    ).toBe('strong');
    expect(recordingMatch(a, { ...a, endDate: '2026-10-20T08:30:00Z' })).toBe(
      'possible',
    );
    expect(
      recordingMatch(a, { ...a, values: { ...a.values, sport: 'CYCLING' } }),
    ).toBe('none');
    expect(
      recordingMatch(a, {
        ...a,
        startDate: a.endDate,
        endDate: '2026-10-20T10:00:00Z',
      }),
    ).toBe('none');
    expect(recordingMatch(a, { ...a, recordingKind: 'multisport_leg' })).toBe(
      'possible',
    );
  });
});
