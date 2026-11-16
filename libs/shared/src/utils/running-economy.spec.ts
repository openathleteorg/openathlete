import { describe, expect, it } from 'vitest';

import { median, powerToPace, runEnergyPerMetre } from './running-economy';

/** A steady run: 1 sample a second at 4 m/s and 320 W */
const run = (seconds: number, speed = 4, watts = 320) => ({
  time: Array.from({ length: seconds }, (_, i) => i),
  distance: Array.from({ length: seconds }, (_, i) => i * speed),
  watts: Array.from({ length: seconds }, () => watts),
});

describe('runEnergyPerMetre', () => {
  it('divides the work by the distance', () => {
    expect(runEnergyPerMetre(run(900))).toBeCloseTo(80, 6);
  });

  it('leaves out walking, stops and pauses', () => {
    const stream = run(900);
    // A walk at 1 m/s with power, then a 60 s gap
    for (let i = 0; i < 120; i++) {
      stream.time.push(900 + i);
      stream.distance.push(stream.distance[stream.distance.length - 1] + 1);
      stream.watts.push(150);
    }
    stream.time.push(1100);
    stream.distance.push(stream.distance[stream.distance.length - 1] + 200);
    stream.watts.push(320);
    expect(runEnergyPerMetre(stream)).toBeCloseTo(80, 6);
  });

  it('needs ten minutes of running with power', () => {
    expect(runEnergyPerMetre(run(500))).toBeNull();
    expect(runEnergyPerMetre({ ...run(900), watts: undefined })).toBeNull();
  });
});

describe('median', () => {
  it('takes the middle run', () => {
    expect(median([82, 79, 120])).toBe(82);
    expect(median([80, 84])).toBe(82);
    expect(median([])).toBeNull();
  });
});

describe('powerToPace', () => {
  it('gives minutes per km', () => {
    // 320 W at 80 J/m is 4 m/s: 4:10/km
    expect(powerToPace(320, 80)).toBeCloseTo(4 + 10 / 60, 6);
  });
});
