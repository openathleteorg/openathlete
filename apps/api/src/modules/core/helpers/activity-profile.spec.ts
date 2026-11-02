import { ActivityStream, SPORT_TYPE } from '@openathlete/shared';

import { ProfileBin, activityProfile } from './activity-profile';

/** One sample every 5 s at `speed` m/s on a steady grade */
function steady(minutes: number, speed: number, grade = 0): ActivityStream {
  const samples = (minutes * 60) / 5;
  return {
    time: Array.from({ length: samples }, (_, i) => i * 5),
    distance: Array.from({ length: samples }, (_, i) => i * 5 * speed),
    altitude: Array.from(
      { length: samples },
      (_, i) => 1000 + i * 5 * speed * grade,
    ),
  };
}

/** The slope most of the outing sits on: smoothing bends its two ends */
const dominant = (bins: ProfileBin[]) =>
  [...bins].sort((a, b) => b.seconds - a.seconds)[0];

describe('activityProfile', () => {
  it('reads the vertical speed of a climb', () => {
    // 2 m/s at 10%: 0.2 m/s of climb, 720 m/h
    const bin = dominant(
      activityProfile(steady(30, 2, 0.1), SPORT_TYPE.TRAIL_RUNNING),
    );
    expect(bin.bin).toBe(10);
    expect(bin.value).toBeCloseTo(720, -1);
  });

  it('files a descent under a negative slope, in positive metres', () => {
    const bin = dominant(
      activityProfile(steady(30, 3, -0.1), SPORT_TYPE.RUNNING),
    );
    expect(bin.bin).toBe(-10);
    expect(bin.value).toBeCloseTo(1080, -1);
  });

  it('leaves flat ground out of the slopes', () => {
    expect(activityProfile(steady(30, 3), SPORT_TYPE.RUNNING)).toEqual([]);
  });

  it('skips the warm-up of the heart rate and sorts by speed', () => {
    const stream = steady(20, 3);
    stream.gap = stream.time!.map(() => 3);
    stream.heartrate = stream.time!.map((t) => (t < 300 ? 100 : 150));
    const speed = activityProfile(stream, SPORT_TYPE.RUNNING).filter(
      ({ kind }) => kind === 'SPEED',
    );
    // 10.8 km/h, in half km/h
    expect(speed).toEqual([
      { kind: 'SPEED', bin: 21, seconds: expect.any(Number), value: 150 },
    ]);
  });

  it('sees a pace fading and a heart rate rising on a long outing', () => {
    const stream = steady(65, 3);
    const span = 3900;
    stream.gap = stream.time!.map((t) => (t < span / 3 ? 3 : 2.7));
    stream.heartrate = stream.time!.map((t) => (t < span / 3 ? 140 : 154));
    const profile = activityProfile(stream, SPORT_TYPE.RUNNING);
    expect(
      profile.find(({ kind }) => kind === 'DRIFT_PACE')?.value,
    ).toBeCloseTo(10, 0);
    expect(
      profile.find(({ kind }) => kind === 'DRIFT_HEARTRATE')?.value,
    ).toBeCloseTo(10, 0);
  });

  it('has no drift on a short outing', () => {
    const stream = steady(30, 3);
    stream.gap = stream.time!.map(() => 3);
    stream.heartrate = stream.time!.map(() => 150);
    expect(
      activityProfile(stream, SPORT_TYPE.RUNNING).some(({ kind }) =>
        kind.startsWith('DRIFT'),
      ),
    ).toBe(false);
  });

  it('reads power on a bike', () => {
    const stream = steady(20, 8);
    stream.watts = stream.time!.map(() => 205);
    stream.heartrate = stream.time!.map(() => 140);
    const power = activityProfile(stream, SPORT_TYPE.CYCLING).find(
      ({ kind }) => kind === 'POWER',
    );
    expect(power).toMatchObject({ bin: 20, value: 140 });
  });

  it('stays out of sports slope and pace do not describe', () => {
    expect(activityProfile(steady(30, 1, 0.1), SPORT_TYPE.SWIMMING)).toEqual(
      [],
    );
  });
});
