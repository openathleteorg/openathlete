import { describe, expect, it, vi } from 'vitest';

import {
  coachedAthleteId,
  findTab,
  getAppTabs,
  isTabRoot,
} from './app-navigation';

vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

describe('app navigation', () => {
  const athlete = getAppTabs('ATHLETE');
  const coach = getAppTabs('COACH');

  it('groups statistics, records and metrics under one tab', () => {
    for (const path of ['statistics', 'records', 'metrics']) {
      expect(findTab(athlete, `/dashboard/${path}`)?.id).toBe('progress');
    }
  });

  it('keeps settings in the Me tab, as screens pushed over it', () => {
    expect(findTab(athlete, '/dashboard/settings')?.id).toBe('me');
    expect(isTabRoot(athlete, '/dashboard/settings')).toBe(false);
    expect(isTabRoot(athlete, '/dashboard/profile')).toBe(true);
  });

  it('pushes an activity and a coached athlete over the tabs', () => {
    expect(isTabRoot(athlete, '/dashboard/activity/12')).toBe(false);
    expect(isTabRoot(coach, '/dashboard/calendar/12')).toBe(false);
    expect(coachedAthleteId('/dashboard/records/12')).toBe('12');
    expect(coachedAthleteId('/dashboard/activity/12')).toBeUndefined();
  });

  it('gives coaches their athletes first', () => {
    expect(coach[0].id).toBe('athletes');
    expect(athlete[0].id).toBe('today');
  });
});
