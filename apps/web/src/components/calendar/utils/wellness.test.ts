import { describe, expect, it, vi } from 'vitest';

import { wellnessItems } from './wellness';

vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get: (_, key) => (params?: object) =>
        `${String(key)} ${JSON.stringify(params ?? {})}`,
    },
  ),
}));

const day = {
  date: '2026-10-12',
  load: 0,
  ctl: 0,
  atl: 0,
  tsb: 0,
  projected: false,
};

describe('day wellness', () => {
  it('shows nothing for a day without measurements nor training', () => {
    expect(wellnessItems(undefined)).toEqual([]);
    expect(wellnessItems(day)).toEqual([]);
  });

  it('lists the measurements, then the form', () => {
    const items = wellnessItems({
      ...day,
      ctl: 40,
      atl: 52,
      tsb: -12,
      wellness: {
        SLEEP_DURATION: 7.33,
        HR_REST: 48.4,
        HRV_LAST_NIGHT_AVG: 61.6,
      },
    });
    expect(items.map((item) => [item.key, item.text])).toEqual([
      ['sleep', '7h20'],
      ['hrv', '62'],
      ['resting-hr', '48'],
      ['form', 'TSB -12'],
    ]);
  });

  it('marks the projected form apart', () => {
    const [form] = wellnessItems({
      ...day,
      ctl: 10,
      atl: 5,
      tsb: 5,
      projected: true,
    });
    expect(form.className).toContain('italic');
    expect(form.dotClass).toBeTruthy();
    expect(form.label).toContain('calendar_wellness_form_projected');
  });
});
