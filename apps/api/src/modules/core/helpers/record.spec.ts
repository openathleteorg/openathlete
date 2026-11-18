import { ActivityStream } from '@openathlete/shared';

import { computeRecords } from './record';

// Metres per degree of latitude on the sphere used by the haversine formula
const METRES_PER_DEGREE = (2 * Math.PI * 6371000) / 360;

/** A straight route north, one point per (seconds, metres) step. */
function route(steps: Step[]) {
  const time = [0];
  const latlng = [[45, 5]];
  let t = 0;
  let d = 0;
  for (const [seconds, metres] of steps) {
    t += seconds;
    d += metres;
    time.push(t);
    latlng.push([45 + d / METRES_PER_DEGREE, 5]);
  }
  return { time, latlng };
}

type Step = [seconds: number, metres: number];
const repeat = (count: number, step: Step): Step[] =>
  Array.from({ length: count }, () => step);

function speedRecords(stream: ReturnType<typeof route>) {
  return new Map(
    computeRecords(stream)
      .filter((record) => record.type === 'SPEED')
      .map((record) => [record.distance!, record.value]),
  );
}

describe('speed records', () => {
  test('finds every distance on a sparse recording', () => {
    // One point every 20 s at 5 m/s, as smart recording on a bike does
    const records = speedRecords(route(repeat(201, [20, 100])));
    expect(records.get(1000)).toBeCloseTo(200, 0);
    expect(records.get(1500)).toBeCloseTo(300, 0);
    expect(records.get(20000)).toBeCloseTo(4000, 0);
    expect(records.has(21097.5)).toBe(false);
  });

  test('does not depend on where the points fall', () => {
    // A steady 4 m/s, recorded every 1, 3 or 9 seconds
    const pattern: Step[] = [
      [3, 12],
      [9, 36],
      [1, 4],
    ];
    const records = speedRecords(
      route(repeat(400, pattern[0]).map((_, i) => pattern[i % 3])),
    );
    expect(records.size).toBeGreaterThan(5);
    for (const [distance, time] of records) {
      expect(time).toBeCloseTo(distance / 4, 3);
    }
  });

  test('finds a fast kilometre between points that miss its ends', () => {
    // 5 m/s, one point every 35 m, inside running at 3 m/s
    const records = speedRecords(
      route([
        ...repeat(100, [9, 27]),
        ...repeat(40, [7, 35]),
        ...repeat(100, [9, 27]),
      ]),
    );
    expect(records.get(1000)).toBeCloseTo(200, 3);
  });

  test('can rank a longer distance faster when a stop splits the shorter ones', () => {
    // Any 800 m includes the stop, the full 1000 m spreads it further
    const records = speedRecords(
      route([...repeat(10, [10, 50]), [120, 0], ...repeat(10, [10, 50])]),
    );
    expect(records.get(800)).toBeCloseTo(280, 3);
    expect(records.get(1000)).toBeCloseTo(320, 3);
  });
});

describe('duration records', () => {
  const durationRecords = (
    records: ReturnType<typeof computeRecords>,
    type: string,
  ) =>
    new Map(
      records
        .filter((record) => record.type === type)
        .map((record) => [record.duration!, record.value]),
    );

  test('finds the best power over each duration, without a GPS route', () => {
    // One sample per second for 10 minutes: 400 W from 60 s to 359 s
    const time = Array.from({ length: 601 }, (_, i) => i);
    const watts = time.map((t) => (t >= 60 && t < 360 ? 400 : 200));
    const power = durationRecords(computeRecords({ time, watts }), 'POWER');
    expect(power.get(5)).toBe(400);
    expect(power.get(300)).toBe(400);
    expect(power.get(600)).toBeCloseTo(300, 0);
    expect(power.has(1200)).toBe(false);
    expect(
      computeRecords({ time, watts }).every((r) => r.distance === null),
    ).toBe(true);
  });

  test('weighs samples by the time they cover', () => {
    // 300 bpm for one second, then 150 bpm sampled every 5 s
    const time = [0, 1, 6, 11, 16, 21, 26, 31];
    const heartrate = [300, 150, 150, 150, 150, 150, 150, 150];
    const records = durationRecords(
      computeRecords({ time, heartrate }),
      'HEARTRATE',
    );
    expect(records.get(30)).toBeCloseTo((300 + 150 * 29) / 30, 5);
  });

  test('counts a long gap in the samples as zero', () => {
    // 20 s at 300 W, a 10 minute dropout, then 20 s at 300 W
    const time = [
      ...Array.from({ length: 21 }, (_, i) => i),
      ...Array.from({ length: 21 }, (_, i) => 620 + i),
    ];
    const watts = time.map(() => 300);
    const power = durationRecords(computeRecords({ time, watts }), 'POWER');
    expect(power.get(15)).toBe(300);
    // At most 15 s of the dropout borrow the last sample
    expect(power.get(600)).toBeLessThan(300 * (55 / 600) + 1e-9);
  });
});

describe('climbing speed records', () => {
  const verticalSpeed = (stream: ActivityStream, sport = 'TRAIL_RUNNING') =>
    new Map(
      computeRecords(stream, sport)
        .filter((record) => record.type === 'VERTICAL_SPEED')
        .map((record) => [record.duration!, record.value]),
    );
  // 10 min flat, 20 min climbing 400 m (1200 m/h), 10 min down
  const climb = () => {
    const time = Array.from({ length: 2401 }, (_, i) => i);
    const altitude = time.map((t) =>
      t < 600
        ? 700
        : t < 1800
          ? 700 + ((t - 600) / 1200) * 400
          : 1100 - (t - 1800) / 3,
    );
    return { time, altitude };
  };

  test('measures the metres gained per hour over the durations of power', () => {
    const vam = verticalSpeed(climb());
    expect([...vam.keys()]).toEqual([300, 600, 1200, 1800]);
    expect(vam.get(300)).toBeCloseTo(1200, 6);
    // The smoothing rounds the top of the climb off by a few metres
    expect(vam.get(1200)).toBeGreaterThan(1180);
    // Half an hour takes in the flat start: 400 m net
    expect(vam.get(1800)).toBeGreaterThan(790);
  });

  test('keeps no minute and no 40 minutes, as power and heart rate', () => {
    const vam = verticalSpeed(climb());
    expect(vam.has(60)).toBe(false);
    expect(vam.has(2400)).toBe(false);
  });

  test('is not moved by a single altimeter spike at the end of a window', () => {
    const stream = climb();
    // 30 m up for two samples on the flat start
    stream.altitude[300] += 30;
    stream.altitude[301] += 30;
    expect(verticalSpeed(stream).get(300)).toBeCloseTo(1200, 6);
  });

  test('smooths the altitude over distance when there is one', () => {
    const stream = {
      ...climb(),
      distance: Array.from({ length: 2401 }, (_, i) => i * 2.5),
    };
    // A 30 m jump of one sample
    stream.altitude[1000] += 30;
    // The 100 m window spreads it to 30 m / 40 samples: under a metre
    expect(verticalSpeed(stream).get(300)).toBeLessThan(1220);
  });

  test('keeps the best plausible climb when a faster window spans a jump', () => {
    const stream = climb();
    // The altimeter steps 150 m up on the flat start and stays there
    for (let t = 300; t <= 2400; t++) stream.altitude[t] += 150;
    // Five minutes across the step would read 1800 m/h: skipped
    expect(verticalSpeed(stream).get(300)).toBeCloseTo(1200, 6);
  });

  test('keeps the best plausible climb when a faster window is too fast', () => {
    const stream = climb();
    // 2 m/s for 2 minutes on the flat start: no single jump, but 2700 m/h
    // over five minutes, beyond what a human climbs
    for (let t = 200; t <= 2400; t++)
      stream.altitude[t] += Math.min(Math.max(t - 200, 0), 120) * 2;
    expect(verticalSpeed(stream).get(300)).toBeCloseTo(1200, 6);
  });

  test('only for sports climbed on foot, on a bike or on skins', () => {
    expect(verticalSpeed(climb(), 'BACKCOUNTRY_SKI').get(300)).toBeCloseTo(
      1200,
      6,
    );
    expect(verticalSpeed(climb(), 'CYCLING').size).toBeGreaterThan(0);
    for (const sport of [
      'ALPINE_SKI',
      'SNOWBOARD',
      'E_BIKE_RIDE',
      'E_MOUNTAIN_BIKE_RIDE',
      'VIRTUAL_RIDE',
    ])
      expect(verticalSpeed(climb(), sport).size).toBe(0);
    expect(
      computeRecords(climb()).some((r) => r.type === 'VERTICAL_SPEED'),
    ).toBe(false);
  });

  test('counts the net gain, so an altimeter wobbling up and down adds nothing', () => {
    const time = Array.from({ length: 601 }, (_, i) => i);
    const altitude = time.map((t) => 500 + (t % 2 ? 1 : 0));
    expect(verticalSpeed({ time, altitude }).get(300) ?? 0).toBeLessThanOrEqual(
      12,
    );
  });

  test('reads between sparse samples, and leaves a descent without record', () => {
    // A sample every 20 s, 300 m climbed in 15 min
    const time = Array.from({ length: 46 }, (_, i) => i * 20);
    const altitude = time.map((t) => 1000 + t / 3);
    expect(verticalSpeed({ time, altitude }).get(600)).toBeCloseTo(1200, 6);
    expect(
      verticalSpeed({ time, altitude: altitude.map((a) => 3000 - a) }).size,
    ).toBe(0);
  });
});
