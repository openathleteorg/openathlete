import { afterEach, describe, expect, it, vi } from 'vitest';

import { localDateKey, saveTimeZone } from './time-zone';

const api = vi.hoisted(() => ({ updateAccount: vi.fn() }));
vi.mock('@/api/user/user.api', () => ({ UserAPI: api }));

const deviceZone = (timeZone: string) =>
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    timeZone,
  } as Intl.ResolvedDateTimeFormatOptions);

describe('saveTimeZone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    api.updateAccount.mockReset();
  });

  it("saves the device's time zone when the profile has none", async () => {
    deviceZone('Europe/Paris');
    await saveTimeZone(null);
    expect(api.updateAccount).toHaveBeenCalledWith({
      timeZone: 'Europe/Paris',
    });
  });

  it('saves the new time zone after travelling', async () => {
    deviceZone('America/New_York');
    await saveTimeZone('Europe/Paris');
    expect(api.updateAccount).toHaveBeenCalledWith({
      timeZone: 'America/New_York',
    });
  });

  it('sends nothing when it did not change', async () => {
    deviceZone('Europe/Paris');
    await saveTimeZone('Europe/Paris');
    expect(api.updateAccount).not.toHaveBeenCalled();
  });

  it('keeps the saved one when the browser reports an unknown zone', async () => {
    deviceZone('Mars/Olympus_Mons');
    await saveTimeZone('Europe/Paris');
    expect(api.updateAccount).not.toHaveBeenCalled();
  });
});

describe('localDateKey', () => {
  it('keeps the local day the calendar picked', () => {
    expect(localDateKey(new Date(2026, 10, 26, 0, 30))).toBe('2026-11-26');
    expect(localDateKey(new Date(2026, 11, 1, 23, 30))).toBe('2026-12-01');
  });
});
