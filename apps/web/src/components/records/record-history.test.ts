import { describe, expect, it } from 'vitest';

import {
  RECORD_TYPE,
  RecordEffortDto,
  RecordHistoryDto,
  SPORT_TYPE,
} from '@openathlete/shared';

import {
  allTimeRecords,
  headlinePositions,
  latestRecords,
  recordGap,
  recordProgress,
  recordYears,
  suspectRecords,
} from './record-history';
import { RECORD_METRICS } from './record-metrics';

const pace = RECORD_METRICS.find((m) => m.type === RECORD_TYPE.SPEED)!;

const effort = (
  type: RECORD_TYPE,
  position: number,
  value: number,
  date = '2026-05-10',
  exclusionId: number | null = null,
): RecordEffortDto => {
  const byDistance =
    type === RECORD_TYPE.SPEED || type === RECORD_TYPE.ELEVATION_GAIN;
  return {
    recordId: value,
    type,
    distance: byDistance ? position : null,
    duration: byDistance ? null : position,
    value,
    date: new Date(date),
    eventId: 1,
    activityName: 'Run',
    eventActivityId: 1,
    exclusionId,
  };
};

describe('suspectRecords', () => {
  it('flags a short pace record far ahead of the next activity', () => {
    const jump = effort(RECORD_TYPE.SPEED, 400, 49);
    expect(suspectRecords([jump, effort(RECORD_TYPE.SPEED, 400, 78)])).toEqual([
      jump,
    ]);
  });

  it('leaves a close record alone', () => {
    expect(
      suspectRecords([
        effort(RECORD_TYPE.SPEED, 5000, 1305),
        effort(RECORD_TYPE.SPEED, 5000, 1343),
      ]),
    ).toEqual([]);
  });

  it('trusts a marathon far ahead of training runs', () => {
    expect(
      suspectRecords([
        effort(RECORD_TYPE.SPEED, 42195, 13374),
        effort(RECORD_TYPE.SPEED, 42195, 19321),
      ]),
    ).toEqual([]);
  });

  it('flags a heart rate far above the next activity', () => {
    const reading = effort(RECORD_TYPE.HEARTRATE, 300, 202);
    expect(
      suspectRecords([reading, effort(RECORD_TYPE.HEARTRATE, 300, 181)]),
    ).toEqual([reading]);
  });

  it('needs a second activity to compare with', () => {
    expect(suspectRecords([effort(RECORD_TYPE.SPEED, 400, 49)])).toEqual([]);
  });

  it('never flags power or climbing', () => {
    expect(
      suspectRecords([
        effort(RECORD_TYPE.POWER, 5, 900),
        effort(RECORD_TYPE.POWER, 5, 400),
        effort(RECORD_TYPE.ELEVATION_GAIN, 400, 200),
        effort(RECORD_TYPE.ELEVATION_GAIN, 400, 50),
      ]),
    ).toEqual([]);
  });
});

describe('history', () => {
  const history: RecordHistoryDto = {
    years: [
      { ...effort(RECORD_TYPE.SPEED, 1000, 200, '2024-01-01'), year: 2024 },
      { ...effort(RECORD_TYPE.SPEED, 1000, 210, '2026-01-01'), year: 2026 },
      { ...effort(RECORD_TYPE.SPEED, 1000, 220, '2025-01-01'), year: 2025 },
    ],
    podium: [
      effort(RECORD_TYPE.SPEED, 1000, 200),
      effort(RECORD_TYPE.SPEED, 1000, 210),
      effort(RECORD_TYPE.POWER, 60, 300),
    ],
  };

  it('takes the first of each position as the record', () => {
    expect(allTimeRecords(history).map((r) => r.value)).toEqual([200, 300]);
  });

  it('lists the years, the latest first', () => {
    expect(recordYears(history)).toEqual([2026, 2025, 2024]);
  });

  it('measures the gap whichever way is better', () => {
    const best = effort(RECORD_TYPE.SPEED, 1000, 200);
    expect(recordGap(effort(RECORD_TYPE.SPEED, 1000, 220), best)).toBeCloseTo(
      0.1,
    );
    const watts = effort(RECORD_TYPE.POWER, 60, 200);
    expect(recordGap(effort(RECORD_TYPE.POWER, 60, 180), watts)).toBeCloseTo(
      0.1,
    );
  });
});

describe('headlinePositions', () => {
  it('keeps the usual distances the athlete has', () => {
    expect(headlinePositions(pace, [400, 5000, 10000])).toEqual([5000, 10000]);
  });

  it('falls back on the longest ones', () => {
    expect(headlinePositions(pace, [100, 200, 300, 400, 800])).toEqual([
      200, 300, 400, 800,
    ]);
  });
});

describe('latestRecords', () => {
  it('keeps this year, without heart rate or suspect records', () => {
    const fresh = effort(RECORD_TYPE.SPEED, 5000, 1300, '2026-06-01');
    const later = effort(RECORD_TYPE.POWER, 60, 300, '2026-07-01');
    const suspect = effort(RECORD_TYPE.SPEED, 400, 49, '2026-08-01');
    expect(
      latestRecords(
        [
          fresh,
          later,
          suspect,
          effort(RECORD_TYPE.HEARTRATE, 60, 190, '2026-09-01'),
          effort(RECORD_TYPE.SPEED, 1000, 200, '2025-06-01'),
        ],
        2026,
        [suspect],
      ),
    ).toEqual([later, fresh]);
  });
});

describe('recordProgress', () => {
  it('carries the best forward, in date order, without excluded efforts', () => {
    const points = recordProgress(
      pace,
      [
        effort(RECORD_TYPE.SPEED, 1000, 240, '2025-01-01'),
        effort(RECORD_TYPE.SPEED, 1000, 200, '2024-01-01'),
        effort(RECORD_TYPE.SPEED, 1000, 250, '2023-01-01'),
        effort(RECORD_TYPE.SPEED, 1000, 100, '2026-01-01', 7),
      ],
      SPORT_TYPE.RUNNING,
    );
    expect(points.map((p) => [p.value, p.best])).toEqual([
      [4, 4],
      [5, 5],
      [1000 / 240, 5],
    ]);
  });
});
