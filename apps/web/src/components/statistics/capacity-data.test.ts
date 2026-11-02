import { describe, expect, it } from 'vitest';

import { BestRecordDto, RECORD_TYPE } from '@openathlete/shared';

import {
  ProfileFigure,
  climbAt,
  descentAt,
  longDrift,
  missingDistances,
  progress,
  racePredictions,
  recordCoherence,
  referenceOutput,
  strongestChanges,
} from './capacity-data';

const bin = (at: number, median: number, count = 3) => ({
  bin: at,
  low: median - 10,
  median,
  high: median + 10,
  count,
});
const figure = (
  axis: ProfileFigure['axis'],
  current: number | null,
  previous: number | null,
  higherIsBetter = true,
): ProfileFigure => ({ axis, current, previous, higherIsBetter });
const record = (distance: number, value: number): BestRecordDto => ({
  recordId: distance,
  type: RECORD_TYPE.SPEED,
  distance,
  duration: null,
  value,
  date: new Date(),
  eventId: null,
  activityName: null,
});

describe('slope figures', () => {
  const terrain = {
    bins: [bin(9, 500), bin(11, 600), bin(-12, 900)],
    classes: [],
  };

  it('reads the nearest slope within two percent', () => {
    expect(climbAt(terrain)).toBe(500);
    expect(descentAt(terrain)).toBe(900);
  });

  it('has nothing without a slope close enough', () => {
    expect(climbAt({ bins: [bin(4, 300)], classes: [] })).toBeNull();
    expect(climbAt(undefined)).toBeNull();
  });
});

describe('longDrift', () => {
  it('reads the longest class of the output, not of the heart rate', () => {
    expect(
      longDrift({
        outings: [],
        series: [
          {
            kind: 'DRIFT_HEARTRATE',
            classes: [{ fromHours: 1, ...bin(0, 9) }],
          },
          {
            kind: 'DRIFT_PACE',
            classes: [
              { fromHours: 1, ...bin(0, 2) },
              { fromHours: 2, ...bin(0, 5) },
            ],
          },
        ],
      }),
    ).toBe(5);
  });
});

describe('referenceOutput', () => {
  it('prefers a band both periods share, over a busier one', () => {
    expect(
      referenceOutput(
        { unit: 'speed', bins: [bin(10, 150, 9), bin(11, 155, 4)] },
        { unit: 'speed', bins: [bin(11, 160, 4)] },
      ),
    ).toEqual({ bin: 11, current: 155, previous: 160 });
  });
});

describe('progress', () => {
  it('is positive when the figure gets better, whichever its direction', () => {
    expect(progress(figure('climb', 110, 100))).toBeCloseTo(10);
    expect(progress(figure('cost', 145, 150, false))).toBeCloseTo(3.33, 1);
  });

  it('needs both periods', () => {
    expect(progress(figure('climb', 110, null))).toBeNull();
  });
});

describe('strongestChanges', () => {
  it('names the best and the worst', () => {
    const { best, worst } = strongestChanges([
      figure('climb', 110, 100),
      figure('descent', 90, 100),
      figure('critical', 101, 100),
    ]);
    expect(best?.axis).toBe('climb');
    expect(worst?.axis).toBe('descent');
  });

  it('calls nothing a weakness when everything rises', () => {
    expect(strongestChanges([figure('climb', 110, 100)]).worst).toBeNull();
  });

  it('leaves drift out: a change from 1% to 2% is not a doubling', () => {
    expect(
      strongestChanges([figure('durability', 2, 1, false)]).worst,
    ).toBeNull();
  });
});

describe('recordCoherence', () => {
  it('draws what an anchor implies, around 1.06', () => {
    const points = recordCoherence([record(5000, 1200)], 5000);
    const ten = points.find(({ distance }) => distance === 10000)!;
    expect(ten.expected).toBeCloseTo(((1200 * 2 ** 1.06) / 10000) * 1000, 3);
    expect(ten.fast).toBeLessThan(ten.expected);
    expect(ten.slow).toBeGreaterThan(ten.expected);
    expect(ten.actual).toBeNull();
  });

  it('opens the slow edge on the marathon', () => {
    const points = recordCoherence([record(5000, 1200)], 5000);
    const half = points.find(({ distance }) => distance === 21097.5)!;
    const marathon = points.at(-1)!;
    expect(marathon.slow / marathon.expected).toBeGreaterThan(
      half.slow / half.expected,
    );
  });

  it('has nothing without its anchor', () => {
    expect(recordCoherence([record(5000, 1200)], 10000)).toEqual([]);
  });
});

describe('missingDistances', () => {
  it('names the distances not run', () => {
    const missing = missingDistances([record(1000, 200), record(5000, 1200)]);
    expect(missing).toContain(10000);
    expect(missing).not.toContain(5000);
  });
});

describe('racePredictions', () => {
  it('gives a range for longer races only, wider on the marathon', () => {
    const { anchor, races } = racePredictions([record(5000, 1200)])!;
    expect(anchor).toBe(5000);
    expect(races.map(({ distance }) => distance)).toEqual([
      10000, 21097.5, 42195,
    ]);
    const spread = ({ fast, slow }: (typeof races)[number]) => slow / fast;
    expect(spread(races[2])).toBeGreaterThan(spread(races[1]));
  });

  it('needs a best over a meaningful distance', () => {
    expect(racePredictions([record(1000, 200)])).toBeNull();
  });
});
