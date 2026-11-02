// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { personalPollingInterval } from './garmin-personal.hooks';

describe('Personal API status polling', () => {
  it('backs off and stops if a queued import never gets a worker', () => {
    expect(personalPollingInterval('queued', 0)).toBe(3000);
    expect(personalPollingInterval('queued', 15000)).toBe(15000);
    expect(personalPollingInterval('queued', 120000)).toBe(false);
    expect(personalPollingInterval('running', 120000)).toBe(3000);
    expect(personalPollingInterval('completed', 0)).toBe(false);
  });
  it('continues bounded polling beyond two minutes until the server queue deadline can recover the job', () => {
    const now = Date.parse('2026-11-02T08:00:00Z');
    expect(
      personalPollingInterval(
        'queued',
        180000,
        new Date(now + 120000).toISOString(),
        now,
      ),
    ).toBe(30000);
    expect(
      personalPollingInterval(
        'queued',
        299000,
        new Date(now + 1000).toISOString(),
        now,
      ),
    ).toBe(1100);
    expect(
      personalPollingInterval(
        'queued',
        301000,
        new Date(now - 1000).toISOString(),
        now,
      ),
    ).toBe(1000);
    expect(personalPollingInterval('failed', 301000, null, now)).toBe(false);
  });
});
