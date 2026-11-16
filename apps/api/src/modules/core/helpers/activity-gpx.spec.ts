import { activityToGpx, gpxFileName } from './activity-gpx';
import { prepareManualGpx } from './manual-gpx-import';

const activity = {
  name: 'Heimgarten & <Herzogstand>',
  startDate: new Date('2026-11-05T08:00:00Z'),
  sport: 'TRAIL_RUNNING',
};

describe('activityToGpx', () => {
  it('writes each point with its altitude, time, heart rate and cadence', () => {
    const gpx = activityToGpx(activity, {
      time: [0, 10],
      latlng: [
        [47.6, 11.2],
        [47.6001, 11.2002],
      ],
      altitude: [640, 641.26],
      heartrate: [120, 131],
      cadence: [80, 0],
    })!;

    expect(gpx).toContain('<name>Heimgarten &amp; &lt;Herzogstand&gt;</name>');
    expect(gpx).toContain('<type>trail_running</type>');
    expect(gpx).toContain('<trkpt lat="47.6001000" lon="11.2002000">');
    expect(gpx).toContain('<ele>641.3</ele>');
    expect(gpx).toContain('<time>2026-11-05T08:00:10.000Z</time>');
    expect(gpx).toContain('<gpxtpx:hr>131</gpxtpx:hr>');
    // No cadence of 0 written
    expect(gpx.match(/<gpxtpx:cad>/g)).toHaveLength(1);
  });

  it('starts a new segment after a GPS gap', () => {
    const gpx = activityToGpx(activity, {
      time: [0, 1, 2],
      latlng: [[47.6, 11.2], [], [47.61, 11.21]],
    })!;
    expect(gpx.match(/<trkseg>/g)).toHaveLength(2);
    expect(gpx.match(/<trkpt /g)).toHaveLength(2);
  });

  it('gives nothing without GPS', () => {
    expect(
      activityToGpx(activity, { time: [0, 1], heartrate: [100, 101] }),
    ).toBeNull();
    expect(activityToGpx(activity, { latlng: [[], []] })).toBeNull();
  });

  it('reads back with the GPX import', () => {
    const gpx = activityToGpx(activity, {
      time: [0, 60, 120],
      latlng: [
        [47.6, 11.2],
        [47.601, 11.201],
        [47.602, 11.202],
      ],
      altitude: [640, 650, 660],
    })!;
    const parsed = prepareManualGpx(Buffer.from(gpx));
    expect(parsed.startDate).toEqual(activity.startDate);
    expect(parsed.activity.sport).toBe('TRAIL_RUNNING');
    expect(parsed.activity.distance).toBeGreaterThan(200);
    expect(parsed.warnings).toEqual([]);
  });
});

describe('gpxFileName', () => {
  it('names the track after the day and the activity', () => {
    expect(
      gpxFileName({
        name: 'Länger Lauf / Zürich!',
        startDate: new Date('2026-01-06T07:00:00Z'),
      }),
    ).toBe('2026-01-06-Langer-Lauf-Zurich.gpx');
  });
});
