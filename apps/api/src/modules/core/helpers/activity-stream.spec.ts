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
  test('does not create GPS-derived records across missing coordinates', () => {
    expect(
      computeRecords({ time: [0, 1, 2], latlng: [[40, 1], [], [41, 1]] }),
    ).toEqual([]);
  });
});
