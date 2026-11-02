import { ActivityStream, SPORT_TYPE } from '@openathlete/shared';

import { activityIntensity, threeZoneSplit } from './activity-intensity';

const zones = [100, 130, 150, 165, 180].map((min, index) => ({
  id: index,
  min,
  max: min + 15,
}));

/** One minute per value, one sample a second */
function stream(
  heartrates: number[],
  extra: (
    minute: number,
  ) => Partial<Record<'gap' | 'watts', number>> = () => ({}),
): ActivityStream {
  const samples = heartrates.flatMap((hr, minute) =>
    Array.from({ length: 60 }, () => ({ hr, ...extra(minute) })),
  );
  return {
    time: samples.map((_, index) => index),
    heartrate: samples.map(({ hr }) => hr),
    gap: samples.map((s) => s.gap ?? 0),
    watts: samples.map((s) => s.watts ?? 0),
  };
}

describe('threeZoneSplit', () => {
  it.each([
    [3, [1, 1, 1]],
    [4, [1, 2, 1]],
    [5, [2, 1, 2]],
    [7, [3, 1, 3]],
  ])('splits %i zones', (count, split) => {
    expect(threeZoneSplit(count)).toEqual(split);
  });

  it('needs three zones', () => {
    expect(threeZoneSplit(2)).toBeNull();
  });
});

describe('activityIntensity', () => {
  it('sorts the time in the three domains', () => {
    const { seconds } = activityIntensity(
      stream([120, 140, 155, 170, 190]),
      SPORT_TYPE.RUNNING,
      zones,
    );
    expect(seconds.map((value) => Math.round(value / 60))).toEqual([2, 1, 2]);
  });

  it('reads power zones first on a bike with a power meter', () => {
    const powerZones = [0, 150, 200, 250, 300].map((min, index) => ({
      id: index + 10,
      min,
      max: min + 49,
    }));
    const { seconds } = activityIntensity(
      stream([190, 190, 190], () => ({ watts: 120 })),
      SPORT_TYPE.CYCLING,
      zones,
      powerZones,
    );
    expect(Math.round(seconds[0] / 60)).toBe(3);
  });

  it('keeps heart rate for a run, whatever the power zones', () => {
    const powerZones = zones.map((zone) => ({ ...zone, id: zone.id + 10 }));
    const { seconds } = activityIntensity(
      stream([190, 190], () => ({ watts: 120 })),
      SPORT_TYPE.RUNNING,
      zones,
      powerZones,
    );
    expect(Math.round(seconds[2] / 60)).toBe(2);
  });

  it('gives metres per heartbeat for running', () => {
    const { efficiencyFactor, decouplingPercent } = activityIntensity(
      stream(Array<number>(30).fill(150), () => ({ gap: 3 })),
      SPORT_TYPE.RUNNING,
      zones,
    );
    expect(efficiencyFactor).toBeCloseTo(1.2, 5);
    expect(decouplingPercent).toBeCloseTo(0, 5);
  });

  it('sees heart rate drifting for the same power', () => {
    const hr = Array.from({ length: 30 }, (_, i) => (i < 15 ? 140 : 154));
    const { decouplingPercent } = activityIntensity(
      stream(hr, () => ({ watts: 200 })),
      SPORT_TYPE.CYCLING,
      zones,
    );
    expect(decouplingPercent).toBeCloseTo(10 / 1.1, 0);
  });

  it('has no efficiency for a sport without a validated output', () => {
    expect(
      activityIntensity(
        stream([150, 150], () => ({ gap: 1 })),
        SPORT_TYPE.SWIMMING,
        zones,
      ).efficiencyFactor,
    ).toBeNull();
  });

  it('stays empty without heart rate or enough zones', () => {
    expect(
      activityIntensity({ time: [0, 1] }, SPORT_TYPE.RUNNING, zones).seconds,
    ).toEqual([]);
    expect(
      activityIntensity(stream([150]), SPORT_TYPE.RUNNING, zones.slice(0, 2))
        .seconds,
    ).toEqual([]);
  });
});
