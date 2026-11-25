import { describe, expect, it } from 'vitest';

import { SPORT_TYPE } from '@openathlete/shared';

import { hasEfficiencyRuns } from './efficiency-data';

const { RUNNING, TRAIL_RUNNING, CYCLING } = SPORT_TYPE;

describe('hasEfficiencyRuns', () => {
  it('shows the card on all sports as soon as the athlete runs', () => {
    expect(hasEfficiencyRuns([CYCLING, TRAIL_RUNNING])).toBe(true);
    expect(hasEfficiencyRuns([CYCLING])).toBe(false);
  });

  it('follows the chosen sport and group', () => {
    const sports = [RUNNING, TRAIL_RUNNING, CYCLING];
    expect(hasEfficiencyRuns(sports, TRAIL_RUNNING)).toBe(true);
    expect(hasEfficiencyRuns(sports, undefined, 'RUNNING')).toBe(true);
    expect(hasEfficiencyRuns(sports, CYCLING)).toBe(false);
    expect(hasEfficiencyRuns(sports, undefined, 'CYCLING')).toBe(false);
    // A runner of the road only, looking at trail runs
    expect(hasEfficiencyRuns([RUNNING], TRAIL_RUNNING)).toBe(false);
  });
});
