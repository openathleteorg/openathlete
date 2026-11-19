import { SPORT_TYPE } from '@openathlete/shared';

import {
  MatchActivity,
  MatchTraining,
  closenessScore,
  isCandidate,
  pickTraining,
} from './training-match.score';

const at = (time: string) => new Date(`2026-03-10T${time}:00Z`);

const session = (
  name: string,
  planned: Partial<MatchTraining> = {},
): MatchTraining & { name: string } => ({
  name,
  sport: SPORT_TYPE.RUNNING,
  goalDuration: null,
  goalDistance: null,
  startDate: at('12:00'),
  ...planned,
});

/** The 50 min, 9 km the athlete ran, warm-up and cool-down included */
const run: MatchActivity = {
  sport: SPORT_TYPE.RUNNING,
  movingTime: 3000,
  distance: 9000,
  startDate: at('17:30'),
};

/**
 * Lap-button warm-up, 6 × (400 m, 60 s rest), lap-button cool-down: the
 * app's total counts the intervals only, about 18 min
 */
const lapIntervals = session('6 × 400 m', { goalDuration: 1081 });

describe('isCandidate', () => {
  it('takes only the same sport', () => {
    expect(isCandidate(run, session('Run'))).toBe(true);
    expect(
      isCandidate(run, session('Trail', { sport: SPORT_TYPE.TRAIL_RUNNING })),
    ).toBe(false);
  });

  it('turns down an activity under 40% of the planned duration and distance', () => {
    const tenK = session('10 km', { goalDuration: 3600, goalDistance: 10000 });
    const aborted = { ...run, movingTime: 300, distance: 800 };
    expect(isCandidate(aborted, tenK)).toBe(false);
  });

  it('takes an activity over 40% of either, as estimates can be far off', () => {
    // Duration estimated at a pace far too fast: the distance is all done
    const tenK = session('10 km', { goalDuration: 9000, goalDistance: 10000 });
    expect(isCandidate({ ...run, distance: 10000 }, tenK)).toBe(true);
  });

  it('takes a run much longer than the estimate of a lap-step session', () => {
    expect(isCandidate(run, lapIntervals)).toBe(true);
  });
});

describe('closenessScore', () => {
  it('averages how close the duration and distance are', () => {
    const tenK = session('10 km', { goalDuration: 3000, goalDistance: 10000 });
    expect(closenessScore(run, tenK)).toBe(95); // (1 + 0.9) / 2
    expect(closenessScore(run, session('Free run'))).toBe(50);
  });
});

describe('pickTraining', () => {
  it('links the lap-step session when it is the only one of the day', () => {
    expect(pickTraining(run, [lapIntervals])?.training).toBe(lapIntervals);
  });

  it('gives an 85 min run to the long run, not to the lap-step intervals', () => {
    const longRun = session('Long run', {
      goalDuration: 5400,
      goalDistance: 16000,
    });
    const run85 = { ...run, movingTime: 5100, distance: 15000 };
    expect(pickTraining(run85, [lapIntervals, longRun])?.training).toBe(
      longRun,
    );
  });

  it('links nothing to a session of another sport', () => {
    const ride = session('Ride', { sport: SPORT_TYPE.CYCLING });
    expect(pickTraining(run, [ride])).toBeNull();
  });

  it('keeps the session from a short jog and gives it to the real run', () => {
    const tenK = session('10 km', { goalDuration: 3600, goalDistance: 10000 });
    const jog = { ...run, movingTime: 600, distance: 2000 };
    expect(pickTraining(jog, [tenK])).toBeNull();
    expect(pickTraining(run, [tenK])?.training).toBe(tenK);
  });

  it('gives a run to the planned session it fits rather than an unplanned one', () => {
    const easyRun = session('Easy run', { startDate: at('17:00') });
    const longRun = session('Long run', { goalDuration: 5400 });
    const run85 = { ...run, movingTime: 5100 };
    expect(pickTraining(run85, [easyRun, longRun])?.training).toBe(longRun);
  });

  it('keeps a run far shorter than the planned session for the unplanned one', () => {
    const easyRun = session('Easy run', { startDate: at('07:00') });
    const longRun = session('Long run', {
      goalDuration: 5400,
      startDate: at('18:00'),
    });
    const run40 = { ...run, movingTime: 2400, startDate: at('07:00') };
    expect(pickTraining(run40, [easyRun, longRun])?.training).toBe(easyRun);
  });

  it('breaks a tie with the session starting closest to the activity', () => {
    const morning = session('Morning run', { startDate: at('07:00') });
    const evening = session('Evening run', { startDate: at('18:00') });
    expect(pickTraining(run, [morning, evening])?.training).toBe(evening);
    expect(
      pickTraining({ ...run, startDate: at('06:30') }, [morning, evening])
        ?.training,
    ).toBe(morning);
  });
});
