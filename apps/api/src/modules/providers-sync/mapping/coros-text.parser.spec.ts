import { MetricType } from '@openathlete/database';

import {
  CorosFormatError,
  parseDailyValues,
  parseFitUrl,
  parseIdInPlan,
  parseSleepOverview,
  parseSportRecords,
  parseVo2Max,
} from './coros-text.parser';

const RECORDS = `Sport Records — 2026-10-01 to 2026-10-06 (2 records)

1. Indoor Run — 2026-10-06
   Time Window: startTimestamp=1791333579 | endTimestamp=1791336739
   Duration: 52:39 | Distance: 12.53 km
   Average Pace: 4:12 /km | Avg HR: 171 bpm | Calories: 710 kcal
   LabelId: 480858305181286402 | SportType: 100

2. Outdoor Run — 2026-09-15
   Location: Cusy Course
   Start Coordinates: 41.318001, 2.094000
   Duration: 1:04:21 | Distance: 11.01 km
   Average Pace: 5:10 /km | Calories: 618 kcal
   LabelId: 480352098744041473 | SportType: 102`;

describe('COROS sport records', () => {
  it('reads each record, keeping the 18-digit id intact', () => {
    const [first, second] = parseSportRecords(RECORDS);
    expect(first).toMatchObject({
      labelId: '480858305181286402',
      sportType: 100,
      sportLabel: 'Indoor Run',
      date: '2026-10-06',
      startTimestamp: 1791333579,
      endTimestamp: 1791336739,
      durationSeconds: 52 * 60 + 39,
      distanceMeters: 12530,
      averageHeartrate: 171,
      calories: 710,
      location: null,
    });
    expect(second).toMatchObject({
      location: 'Cusy Course',
      durationSeconds: 3600 + 4 * 60 + 21,
      startTimestamp: null,
      averageHeartrate: null,
    });
  });

  it('accepts an empty answer', () => {
    expect(
      parseSportRecords(
        'No sport records found from 2020-01-01 to 2020-01-02.',
      ),
    ).toEqual([]);
  });

  it('refuses an answer it cannot read', () => {
    expect(() => parseSportRecords('Sport Records (2 records)')).toThrow(
      CorosFormatError,
    );
    expect(() =>
      parseSportRecords('1. Outdoor Run — 2026-09-15\n   Duration: 10:00'),
    ).toThrow(CorosFormatError);
  });
});

describe('COROS ids and links', () => {
  it('reads idInPlan as text from prose or JSON', () => {
    expect(parseIdInPlan('Saved. idInPlan: 25')).toBe('25');
    expect(parseIdInPlan('{"idInPlan":"9007199254740993"}')).toBe(
      '9007199254740993',
    );
    expect(parseIdInPlan('Saved.')).toBeNull();
  });

  it('finds the FIT address', () => {
    expect(
      parseFitUrl('run.fit: https://oss.coros.com/a/run.fit?sig=1\nnext'),
    ).toBe('https://oss.coros.com/a/run.fit?sig=1');
    expect(parseFitUrl('Daily limit reached')).toBeNull();
  });
});

describe('COROS metrics', () => {
  const day = new Date('2026-10-15T00:00:00.000Z');

  it('reads sleep on the day of waking', () => {
    const metrics = parseSleepOverview(`Sleep Overview

2026-10-15
Sleep Score: 91
Daily Sleep: 7h 57min (incl. naps)
Main Sleep (asleep): 7h 30min
Awake Time: 5 min
Main Sleep Window: 2026-10-15 00:28 - 2026-10-15 08:30
Naps Total: 27 min

2026-10-16
Sleep Score: 0`);
    expect(metrics).toEqual([
      { type: MetricType.SLEEP_SCORE, date: day, value: 91 },
      { type: MetricType.SLEEP_DURATION, date: day, value: 7.5 },
      { type: MetricType.SLEEP_AWAKE_DURATION, date: day, value: 5 / 60 },
      { type: MetricType.NAP_DURATION, date: day, value: 27 / 60 },
    ]);
  });

  it('reads one value per day, in its unit', () => {
    expect(
      parseDailyValues(
        '2026-10-15: 48 bpm\n2026-10-16: no data',
        MetricType.HR_REST,
        'bpm',
      ),
    ).toEqual([{ type: MetricType.HR_REST, date: day, value: 48 }]);
    expect(
      parseDailyValues(
        '2026-10-15\nDaily average: 62.5 ms\nNormal range: 50-70 ms',
        MetricType.HRV_LAST_NIGHT_AVG,
        'ms',
      ),
    ).toEqual([
      { type: MetricType.HRV_LAST_NIGHT_AVG, date: day, value: 62.5 },
    ]);
  });

  it('dates VO2max today', () => {
    expect(parseVo2Max('VO2max: 58\nRunning Level: 94', '2026-10-15')).toEqual([
      { type: MetricType.VO2MAX, date: day, value: 58 },
    ]);
    expect(parseVo2Max('VO2max: --', '2026-10-15')).toEqual([]);
  });
});
