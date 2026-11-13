import { describe, expect, it } from 'vitest';

import { athleteRoute } from './athlete-route';

describe('athleteRoute', () => {
  it("reads a coach's athlete page", () => {
    expect(athleteRoute('/dashboard/metrics/12')).toEqual({
      page: 'metrics',
      athleteId: 12,
    });
    expect(athleteRoute('/dashboard/progression/3/')).toEqual({
      page: 'progression',
      athleteId: 3,
    });
  });

  it("ignores the user's own pages and other routes", () => {
    expect(athleteRoute('/dashboard/calendar')).toBeNull();
    expect(athleteRoute('/dashboard/settings')).toBeNull();
    expect(athleteRoute('/dashboard/activity/12')).toBeNull();
  });
});
