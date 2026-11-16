import { activityEfficiency } from './activity-efficiency';

/** A flat run, a sample a second at 4 m/s, 300 W and 150 bpm */
const flat = (seconds = 1800) => ({
  time: Array.from({ length: seconds }, (_, i) => i),
  distance: Array.from({ length: seconds }, (_, i) => i * 4),
  altitude: Array.from({ length: seconds }, () => 500),
  watts: Array.from({ length: seconds }, () => 300),
  heartrate: Array.from({ length: seconds }, () => 150),
});
const run = {
  sport: 'RUNNING',
  distance: 7200,
  elevationGain: 0,
  movingTime: 1800,
};

describe('activityEfficiency', () => {
  it('reads metres per joule and per heartbeat on the flat', () => {
    const efficiency = activityEfficiency(flat(), run);
    // 4 m/s for 300 W; 300 W for 2.5 beats a second
    expect(efficiency.biomechanicalEfficiency).toBeCloseTo(4 / 300, 9);
    expect(efficiency.metabolicEfficiency).toBeCloseTo(120, 9);
    expect(efficiency.totalEfficiency).toBeCloseTo(1.6, 9);
  });

  it('counts climbing as distance and as power', () => {
    // 200 m climbed in 30 minutes: 400 m/h, 1800 m more, 56 W more
    const efficiency = activityEfficiency(flat(), {
      ...run,
      elevationGain: 200,
    });
    expect(efficiency.totalEfficiency).toBeCloseTo(9000 / 1800 / 2.5, 9);
    expect(efficiency.metabolicEfficiency).toBeCloseTo(356 / 2.5, 9);
  });

  it('leaves the descents out of power and heart rate', () => {
    const stream = flat();
    // The second half goes down 5%, at 100 W and 120 bpm
    for (let i = 900; i < 1800; i++) {
      stream.altitude[i] = 500 - (i - 899) * 4 * 0.05;
      stream.watts[i] = 100;
      stream.heartrate[i] = 120;
    }
    const efficiency = activityEfficiency(stream, run);
    expect(efficiency.metabolicEfficiency).toBeCloseTo(120, 9);
  });

  it('gives what it can without power, and nothing outside running', () => {
    const { watts: _watts, ...noPower } = flat();
    expect(activityEfficiency(noPower, run)).toEqual({
      biomechanicalEfficiency: null,
      metabolicEfficiency: null,
      totalEfficiency: expect.closeTo(1.6, 9),
    });
    expect(activityEfficiency(flat(), { ...run, sport: 'CYCLING' })).toEqual({
      biomechanicalEfficiency: null,
      metabolicEfficiency: null,
      totalEfficiency: null,
    });
    expect(activityEfficiency(flat(300), run).totalEfficiency).toBeNull();
  });
});
