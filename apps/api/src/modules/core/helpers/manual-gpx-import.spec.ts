import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BadRequestException } from '@nestjs/common';

import { uncompressActivityStream } from './activity-stream';
import {
  extensionValue,
  gpxSport,
  prepareManualGpx,
} from './manual-gpx-import';

type Point = {
  lat?: number;
  lon?: number;
  ele?: number;
  /** Seconds after 07:00:00 UTC. */
  at?: number;
  hr?: number;
  cad?: number;
};

// Synthetic tracks only; ~111 m per 0.001 degrees of latitude.
function gpx(
  segments: Point[][],
  options: { type?: string; ns?: string; route?: boolean } = {},
) {
  const ns = options.ns ?? 'gpxtpx';
  const point = (p: Point, tag = 'trkpt') =>
    `<${tag}${p.lat === undefined ? ' lat="0" lon="0"' : ` lat="${p.lat}" lon="${p.lon}"`}>` +
    (p.ele === undefined ? '' : `<ele>${p.ele}</ele>`) +
    (p.at === undefined
      ? ''
      : `<time>${new Date(Date.UTC(2026, 9, 3, 7, 0, p.at)).toISOString()}</time>`) +
    (p.hr === undefined && p.cad === undefined
      ? ''
      : `<extensions><${ns}:TrackPointExtension>` +
        (p.hr === undefined ? '' : `<${ns}:hr>${p.hr}</${ns}:hr>`) +
        (p.cad === undefined ? '' : `<${ns}:cad>${p.cad}</${ns}:cad>`) +
        `</${ns}:TrackPointExtension></extensions>`) +
    `</${tag}>`;
  const body = options.route
    ? `<rte><name>Plan</name>${segments[0].map((p) => point(p, 'rtept')).join('')}</rte>`
    : `<trk><name>Rodaje</name>${options.type ? `<type>${options.type}</type>` : ''}${segments
        .map((s) => `<trkseg>${s.map((p) => point(p)).join('')}</trkseg>`)
        .join('')}</trk>`;
  return Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1" xmlns:${ns}="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">${body}</gpx>`,
  );
}

/** A point every 10 s moving 0.0002 degrees north (~22 m, 2.2 m/s). */
const run = (from: number, count: number, startLat = 43.36): Point[] =>
  Array.from({ length: count }, (_, i) => ({
    lat: startLat + (from + i) * 0.0002,
    lon: -8.41,
    ele: 10,
    at: (from + i) * 10,
    hr: 140,
  }));

const expectCode = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).message).toBe(code);
    return;
  }
  throw new Error(`Expected ${code}`);
};

describe('prepareManualGpx', () => {
  it('accepts the synthetic run used by the end-to-end tests', () => {
    const result = prepareManualGpx(
      readFileSync(
        join(__dirname, '../../../../../../e2e/fixtures/synthetic-run.gpx'),
      ),
    );
    const stream = uncompressActivityStream(result.details.stream);
    expect(result.startDate).toEqual(new Date('2024-05-02T07:00:00Z'));
    expect(result.activity.sport).toBe('RUNNING');
    // 60 steps of ~25 m.
    expect(result.activity.distance).toBeGreaterThan(1450);
    expect(result.activity.distance).toBeLessThan(1550);
    expect(stream.heartrate).toHaveLength(61);
    expect(result.warnings).toEqual([]);
  });

  it('reads every segment, skips the pause and fills short sensor gaps', () => {
    // Garmin Connect writes ns3:hr. Ten points, a 5-minute stop, ten more.
    const first = run(0, 10);
    first[3].hr = undefined;
    const second = run(10, 10).map((p) => ({ ...p, at: p.at! + 300 }));
    const result = prepareManualGpx(
      gpx([first, second], { type: 'running', ns: 'ns3' }),
    );
    const stream = uncompressActivityStream(result.details.stream);

    expect(result.startDate).toEqual(new Date('2026-10-03T07:00:00Z'));
    expect(stream.time).toHaveLength(20);
    expect(stream.latlng).toHaveLength(20);
    // The missing value takes the previous one.
    expect(stream.heartrate).toHaveLength(20);
    expect(stream.heartrate![3]).toBe(140);
    expect(result.activity.sport).toBe('RUNNING');
    // 19 steps of ~22 m.
    expect(result.activity.distance).toBeGreaterThan(400);
    expect(result.activity.distance).toBeLessThan(440);
    // Elapsed 490 s; the 5-minute stop is not moving time.
    expect(+result.endDate - +result.startDate).toBe(490_000);
    expect(result.activity.movingTime).toBe(180);
    expect(result.activity.averageHeartrate).toBe(140);
    expect(result.activity.averageSpeed).toBeCloseTo(
      result.activity.distance / 180,
      1,
    );
    expect(result.warnings).toEqual([]);
  });

  it('counts climbing without altitude noise', () => {
    const points = run(0, 8).map((p, i) => ({
      ...p,
      // Up 10 m with 1 m jitter, then down 5 m.
      ele: [100, 101, 100, 105, 110, 109, 107, 105][i],
    }));
    expect(prepareManualGpx(gpx([points])).activity.elevationGain).toBe(10);
  });

  it('ignores GPS jumps for distance, speed and the map', () => {
    const points = run(0, 6);
    // One point jumps 200 m ahead within a second, then the track goes on.
    points.splice(3, 0, {
      ...points[2],
      lat: points[2].lat! + 0.0018,
      at: 21,
    });
    const result = prepareManualGpx(gpx([points]));
    const stream = uncompressActivityStream(result.details.stream);
    expect(stream.latlng![3]).toEqual([]);
    // Five steps of ~22 m, not 400 m more.
    expect(result.activity.distance).toBeGreaterThan(100);
    expect(result.activity.distance).toBeLessThan(120);
    expect(result.activity.maxSpeed).toBeLessThan(3);
  });

  it('measures max speed over ten seconds, not one-second jitter', () => {
    const points = run(0, 6);
    // 30 m ahead one second after the start: possible, but GPS jitter.
    points.splice(1, 0, {
      ...points[0],
      lat: points[0].lat! + 0.00027,
      at: 1,
    });
    expect(prepareManualGpx(gpx([points])).activity.maxSpeed).toBeLessThan(5);
  });

  it('leaves out a sensor missing on more than a tenth of the points', () => {
    const points = run(0, 10).map((p, i) => ({
      ...p,
      hr: i < 5 ? 150 : undefined,
    }));
    const result = prepareManualGpx(gpx([points]));
    expect(uncompressActivityStream(result.details.stream).heartrate).toBe(
      undefined,
    );
    expect(result.activity.averageHeartrate).toBeNull();
    expect(result.warnings).toContain('GPX_INCOMPLETE_CHANNELS');
  });

  it('keeps a treadmill run without GPS and says the map is missing', () => {
    const points = run(0, 5).map(({ at, hr }) => ({ at, hr }));
    const result = prepareManualGpx(gpx([points]), 'RUNNING' as never);
    const stream = uncompressActivityStream(result.details.stream);
    expect(stream.latlng).toBeUndefined();
    expect(stream.heartrate).toEqual([140, 140, 140, 140, 140]);
    expect(result.activity).toMatchObject({
      distance: 0,
      movingTime: 40,
      sport: 'RUNNING',
    });
    expect(result.warnings).toEqual(['GPX_NO_GPS']);
  });

  it('uses the chosen sport, else the track type, else Other', () => {
    expect(
      prepareManualGpx(gpx([run(0, 3)], { type: 'running' }), 'HIKING' as never)
        .activity.sport,
    ).toBe('HIKING');
    const unknown = prepareManualGpx(gpx([run(0, 3)], { type: 'parkour' }));
    expect(unknown.activity.sport).toBe('OTHER');
    expect(unknown.warnings).toContain('GPX_UNKNOWN_SPORT');
  });

  it('drops points going back in time', () => {
    const points = run(0, 4);
    points.splice(2, 0, { ...points[1], at: 5 });
    const stream = uncompressActivityStream(
      prepareManualGpx(gpx([points])).details.stream,
    );
    expect(stream.time).toEqual([0, 10, 20, 30]);
  });

  it('refuses routes and tracks without times as planned, not recorded', () => {
    expectCode(
      () => prepareManualGpx(gpx([run(0, 3)], { route: true })),
      'GPX_NO_TIME',
    );
    expectCode(
      () =>
        prepareManualGpx(
          gpx([run(0, 3).map(({ lat, lon }) => ({ lat, lon }))]),
        ),
      'GPX_NO_TIME',
    );
    // A single timed point has no duration.
    expectCode(() => prepareManualGpx(gpx([run(0, 1)])), 'GPX_NO_TIME');
  });

  it('refuses files that are not GPX, future activities and huge tracks', () => {
    expectCode(() => prepareManualGpx(Buffer.from('not xml <')), 'GPX_INVALID');
    expectCode(
      () => prepareManualGpx(Buffer.from('<gpx version="1.1"></gpx>')),
      'GPX_INVALID',
    );
    const future = run(0, 3).map((p) => ({ ...p, at: p.at! + 400 * 86400 }));
    expectCode(() => prepareManualGpx(gpx([future])), 'GPX_INVALID');
    const huge = Array.from({ length: 100001 }, (_, i) => ({
      lat: 43,
      lon: -8,
      at: i,
    }));
    expectCode(() => prepareManualGpx(gpx([huge])), 'GPX_LIMIT');
  });
});

describe('gpxSport', () => {
  it('recognizes common track types and Strava numbers', () => {
    expect(gpxSport('running')).toBe('RUNNING');
    expect(gpxSport('Trail Running')).toBe('TRAIL_RUNNING');
    expect(gpxSport('mountain-biking')).toBe('MOUNTAIN_BIKE_RIDE');
    expect(gpxSport('9')).toBe('RUNNING');
    expect(gpxSport(1)).toBe('CYCLING');
    expect(gpxSport('parkour')).toBeUndefined();
    expect(gpxSport(undefined)).toBeUndefined();
  });
});

describe('extensionValue', () => {
  it('finds sensors by local name in any namespace', () => {
    expect(
      extensionValue({ 'ns3:TrackPointExtension': { 'ns3:hr': '151' } }, [
        'hr',
      ]),
    ).toBe(151);
    expect(extensionValue({ power: 230 }, ['power', 'watts'])).toBe(230);
    expect(extensionValue({ 'gpxtpx:TrackPointExtension': {} }, ['hr'])).toBe(
      null,
    );
    expect(extensionValue(undefined, ['hr'])).toBe(null);
  });
});
