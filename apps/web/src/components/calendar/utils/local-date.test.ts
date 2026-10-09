import { describe, expect, it } from 'vitest';

import { endOfLocalDateInput, startOfLocalDateInput } from './local-date';

// Run with several TZ values in CI: the bug only showed west of UTC
describe('date inputs as local days', () => {
  it('starts and ends on the chosen local day', () => {
    const start = startOfLocalDateInput('2026-10-05');
    const end = endOfLocalDateInput('2026-10-11');
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([
      2026, 9, 5,
    ]);
    expect(start.getHours()).toBe(0);
    expect([end.getDate(), end.getHours(), end.getMinutes()]).toEqual([
      11, 23, 59,
    ]);
  });

  it('reads the date picker value, an instant at local noon', () => {
    const picked = new Date(2026, 9, 5, 12).toISOString();
    expect(startOfLocalDateInput(picked)).toEqual(new Date(2026, 9, 5));
    expect(endOfLocalDateInput(picked)).toEqual(
      new Date(2026, 9, 5, 23, 59, 59, 999),
    );
  });
});
