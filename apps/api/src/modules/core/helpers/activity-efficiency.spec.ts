import { activityEfficiency } from './activity-efficiency';

/** A flat run, a sample a second at 4 m/s, 300 W and 150 bpm */
const flat = (seconds = 1800) => ({
  time: Array.from({ length: seconds }, (_, i) => i),
  distance: Array.from({ length: seconds }, (_, i) => i * 4),
  altitude: Array.from({ length: seconds }, () => 500),
  watts: Array.from({ length: seconds }, () => 300),
  heartrate: Array.from({ length: seconds }, () => 150),
});
const run = { sport: 'RUNNING' };

/** The samples from `from` on go up or down `grade` */
function slope(
  stream: ReturnType<typeof flat>,
  from: number,
  grade: number,
  watts: number,
  heartrate: number,
) {
  for (let i = from; i < stream.time.length; i++) {
    stream.altitude[i] =
      500 + (stream.distance[i] - stream.distance[from]) * grade;
    stream.watts[i] = watts;
    stream.heartrate[i] = heartrate;
  }
  return stream;
}

describe('activityEfficiency', () => {
  it('reads metres per joule and watts per beat on the flat', () => {
    const efficiency = activityEfficiency(flat(), run);
    // 4 m/s for 300 W; 300 W at 150 bpm
    expect(efficiency.flatSpeedPerWatt).toBeCloseTo(4 / 300, 9);
    expect(efficiency.powerEfficiencyFactor).toBeCloseTo(2, 9);
  });

  it('adds nothing for climbing: running power already includes it', () => {
    // The second half climbs 8 % at 380 W and 165 bpm
    const efficiency = activityEfficiency(
      slope(flat(3600), 1800, 0.08, 380, 165),
      run,
    );
    // Metres per joule from the flat half only, no VAM term
    expect(efficiency.flatSpeedPerWatt).toBeCloseTo(4 / 300, 3);
    // Power and heart rate of both halves, as measured
    expect(efficiency.powerEfficiencyFactor).toBeCloseTo(340 / 157.5, 2);
  });

  it('leaves the descents out of both sides of the ratio', () => {
    // The second half goes down 5 %, at 100 W and 120 bpm
    const efficiency = activityEfficiency(
      slope(flat(3600), 1800, -0.05, 100, 120),
      run,
    );
    expect(efficiency.powerEfficiencyFactor).toBeCloseTo(2, 2);
    expect(efficiency.flatSpeedPerWatt).toBeCloseTo(4 / 300, 3);
  });

  it('reads the slope on smoothed altitude, not sample by sample', () => {
    // A 0.2 m altimeter step every other second: −5 % between raw samples,
    // flat over the run
    const stream = flat();
    stream.altitude = stream.altitude.map((value, i) =>
      i % 2 ? value - 0.2 : value,
    );
    const efficiency = activityEfficiency(stream, run);
    expect(efficiency.flatSpeedPerWatt).toBeCloseTo(4 / 300, 3);
    expect(efficiency.powerEfficiencyFactor).toBeCloseTo(2, 3);
  });

  it('leaves out stretches where the power drops out', () => {
    const stream = flat();
    for (let i = 600; i < 900; i++) stream.watts[i] = 0;
    // The dropout would otherwise read as metres for free
    expect(activityEfficiency(stream, run).flatSpeedPerWatt).toBeCloseTo(
      4 / 300,
      3,
    );
  });

  it('counts only the metres run with power on a stretch with a few dropouts', () => {
    // One sample in twelve without power: the stretches still count, and
    // the metres of those samples must not read as free
    const stream = flat();
    for (let i = 0; i < stream.watts.length; i += 12) stream.watts[i] = 0;
    expect(activityEfficiency(stream, run).flatSpeedPerWatt).toBeCloseTo(
      4 / 300,
      9,
    );
  });

  it('gives nothing without power, too short, or outside running', () => {
    const { watts: _watts, ...noPower } = flat();
    expect(activityEfficiency(noPower, run)).toEqual({
      flatSpeedPerWatt: null,
      powerEfficiencyFactor: null,
    });
    expect(activityEfficiency(flat(300), run)).toEqual({
      flatSpeedPerWatt: null,
      powerEfficiencyFactor: null,
    });
    expect(activityEfficiency(flat(), { sport: 'CYCLING' })).toEqual({
      flatSpeedPerWatt: null,
      powerEfficiencyFactor: null,
    });
  });

  it('takes a run without altitude as flat', () => {
    const { altitude: _altitude, ...noAltitude } = flat();
    expect(activityEfficiency(noAltitude, run).flatSpeedPerWatt).toBeCloseTo(
      4 / 300,
      9,
    );
  });
});
