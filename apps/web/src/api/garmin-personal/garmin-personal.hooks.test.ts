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
});
