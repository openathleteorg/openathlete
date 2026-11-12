import { describe, expect, it } from 'vitest';

import { SPORT_TYPE, parseWorkoutText } from '@openathlete/shared';

import { suggestSessionName } from './session-name';

const steps = (text: string) =>
  parseWorkoutText(text, { sport: SPORT_TYPE.RUNNING }).steps;

describe('suggestSessionName', () => {
  it('names a session after its main sets, efforts only', () => {
    expect(
      suggestSessionName(
        steps('- 15m\n- 6x(1km / 2m)\n- 3x(10m / 2m)\n- 10m'),
        'Run',
        3600,
      ),
    ).toBe("6 × 1 km · 3 × 10'");
  });

  it('prefers the name given to a set', () => {
    expect(
      suggestSessionName(steps('Côtes 8x\n- 45s\n- lap'), 'Run', 900),
    ).toBe('Côtes');
  });

  it('names a strength session after its first exercises', () => {
    const lift = (name: string) => ({
      stepType: 'INTERVAL_ACTIVE' as never,
      name,
      exerciseRef: `c:${name}`,
      durationType: 'REPS' as never,
      durationValue: 8,
      targets: [],
    });
    expect(
      suggestSessionName(
        [
          {
            stepType: 'REPEAT' as never,
            targets: [],
            repeatBlock: { repetitions: 4, childSteps: [lift('Squat')] },
          },
          lift('Fentes'),
          lift('Squat'),
        ],
        'Musculation',
        1800,
      ),
    ).toBe('Squat, Fentes');
    expect(
      suggestSessionName(['A', 'B', 'C', 'D'].map(lift), 'Musculation', 1800),
    ).toBe('A, B, C…');
  });

  it('falls back on the sport and length, then on nothing', () => {
    expect(suggestSessionName(steps('- 45m'), 'Footing', 2700)).toBe(
      'Footing 45 min',
    );
    expect(suggestSessionName([], 'Footing', null)).toBe('');
  });
});
