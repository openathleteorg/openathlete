import { isRecentActivity } from './recent-activity.constant';

describe('isRecentActivity', () => {
  const now = Date.parse('2026-11-21T12:00:00Z');

  it('takes an activity of the last 7 days as new', () => {
    expect(isRecentActivity(new Date('2026-11-21T06:00:00Z'), now)).toBe(true);
    expect(isRecentActivity(new Date('2026-11-14T12:00:00Z'), now)).toBe(true);
  });

  it('takes an older activity as history', () => {
    expect(isRecentActivity(new Date('2026-11-14T11:59:59Z'), now)).toBe(false);
  });
});
