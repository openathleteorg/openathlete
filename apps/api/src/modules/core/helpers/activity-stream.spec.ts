import {
  ActivityStream,
  isValidGpsPoint,
  splitGpsPath,
} from '@openathlete/shared';

import {
  compressActivityStream,
  reductActivityStreamToResolution,
  uncompressActivityStream,
} from './activity-stream';
import { computeRecords } from './record';

describe('GPS gaps in shared provider streams', () => {
  test('round-trips leading, repeated, internal and trailing gaps through JSON compression', () => {
    const stream = {
      time: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      latlng: [[], [], [], [], [40, 1], [], [40, 2], [40, 2], []],
    };
    expect(
      uncompressActivityStream(
        JSON.parse(JSON.stringify(compressActivityStream(stream))),
      ),
    ).toEqual(stream);
  });
  test('normalizes unavailable/invalid provider coordinates without shifting later samples', () => {
    const stream = {
      time: [0, 1, 2, 3, 4],
      latlng: [null, [40, 1], [NaN, 1], [91, 1], [40, 2]],
    } as unknown as ActivityStream;
    expect(
      uncompressActivityStream(compressActivityStream(stream)).latlng,
    ).toEqual([[], [40, 1], [], [], [40, 2]]);
  });
  test('preserves valid Strava-style streams, including real zero coordinates', () => {
    const stream = {
      time: [0, 1, 2],
      latlng: [
        [0, 0],
        [0, 1],
        [1, 1],
      ],
      heartrate: [100, 110, 120],
    };
    expect(uncompressActivityStream(compressActivityStream(stream))).toEqual(
      stream,
    );
  });
  test('does not guess timestamps for a provider GPS channel with a different length', () => {
    expect(
      compressActivityStream({
        time: [0, 1, 2],
        latlng: [
          [40, 1],
          [40, 2],
        ],
      }).latlng,
    ).toBeUndefined();
  });
  test('retains a GPS gap that falls between downsampled indices', () => {
    const path = [[40, 1], [], [40, 2], [40, 3], [40, 4], [40, 5]];
    expect(reductActivityStreamToResolution(path, 3)).toEqual([
      [40, 1],
      [],
      [40, 4],
    ]);
    expect(reductActivityStreamToResolution([0, 1, 2, 3, 4, 5], 3)).toEqual([
      0, 2, 4,
    ]);
  });
  test('map paths break at gaps rather than connecting them', () => {
    expect(splitGpsPath([[], [40, 1], [40, 2], [], [40, 3], []])).toEqual([
      [
        [40, 1],
        [40, 2],
      ],
      [[40, 3]],
    ]);
    expect(splitGpsPath([[], []])).toEqual([]);
    expect(isValidGpsPoint([0, 0])).toBe(true);
    expect(isValidGpsPoint([])).toBe(false);
  });
  test('does not count distance across missing coordinates', () => {
    // 1 km apart, but the gap between them is not bridged
    expect(
      computeRecords({ time: [0, 1, 2], latlng: [[40, 1], [], [40.009, 1]] }),
    ).toEqual([]);
  });
  test('keeps records when the GPS fix comes late', () => {
    // ~3.3 m per second after the fix: 400 m takes about 120 s
    const fixed = Array.from({ length: 200 }, (_, i) => [40 + i * 0.00003, 1]);
    const records = computeRecords({
      time: Array.from({ length: 205 }, (_, i) => i),
      latlng: [[], [], [], [], [], ...fixed],
    });
    const speed400 = records.find(
      (record) => record.type === 'SPEED' && record.distance === 400,
    );
    expect(speed400?.value).toBeGreaterThan(115);
    expect(speed400?.value).toBeLessThan(125);
  });
});
