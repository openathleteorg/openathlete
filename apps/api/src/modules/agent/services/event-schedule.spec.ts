import { zonedClock } from 'src/common/utils/time-zone';

import { generatedEventDay, generatedEventWindow } from './event-schedule';

const SERVER_TIME_ZONES = ['UTC', 'Europe/Paris', 'America/Los_Angeles'];

describe.each(SERVER_TIME_ZONES)('with the server in %s', (serverTimeZone) => {
  const originalTimeZone = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = serverTimeZone;
  });

  afterEach(() => {
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
  });

  it('starts at noon on the local day sent, whatever the server zone', () => {
    const { startDate } = generatedEventWindow(
      '2026-11-26',
      'Europe/Paris',
      null,
    );
    expect(startDate.toISOString()).toBe('2026-11-26T11:00:00.000Z');
  });

  it('keeps the day sent at month and year ends', () => {
    expect(
      generatedEventWindow(
        '2026-01-31',
        'America/Los_Angeles',
        null,
      ).startDate.toISOString(),
    ).toBe('2026-01-31T20:00:00.000Z');
    expect(
      generatedEventWindow(
        '2026-12-31',
        'Europe/Paris',
        null,
      ).startDate.toISOString(),
    ).toBe('2026-12-31T11:00:00.000Z');
    expect(
      generatedEventWindow(
        '2027-01-01',
        'Asia/Tokyo',
        null,
      ).startDate.toISOString(),
    ).toBe('2027-01-01T03:00:00.000Z');
  });

  it('follows daylight saving changes in the client zone', () => {
    expect(
      generatedEventWindow(
        '2026-07-15',
        'Europe/Paris',
        null,
      ).startDate.toISOString(),
    ).toBe('2026-07-15T10:00:00.000Z');
    expect(
      generatedEventWindow(
        '2026-10-25',
        'Europe/Paris',
        null,
      ).startDate.toISOString(),
    ).toBe('2026-10-25T11:00:00.000Z');
    expect(
      generatedEventWindow(
        '2026-03-07',
        'America/New_York',
        null,
      ).startDate.toISOString(),
    ).toBe('2026-03-07T17:00:00.000Z');
    expect(
      generatedEventWindow(
        '2026-03-08',
        'America/New_York',
        null,
      ).startDate.toISOString(),
    ).toBe('2026-03-08T16:00:00.000Z');
  });

  it('returns the same calendar day it was given in every client zone', () => {
    for (const timeZone of [
      'UTC',
      'Europe/Paris',
      'America/Los_Angeles',
      'Asia/Tokyo',
      'Pacific/Kiritimati',
    ]) {
      const { startDate } = generatedEventWindow('2026-11-26', timeZone, null);
      expect(zonedClock(startDate, timeZone)).toEqual({
        date: '2026-11-26',
        hour: 12,
      });
    }
  });
});

describe('generatedEventDay', () => {
  it('keeps the calendar day as sent', () => {
    expect(generatedEventDay('2026-11-26', 'Europe/Paris')).toBe('2026-11-26');
  });

  it('reads a legacy local-midnight instant in the client zone', () => {
    // What the old client sent for 26 November in Paris
    expect(generatedEventDay('2026-11-25T23:00:00.000Z', 'Europe/Paris')).toBe(
      '2026-11-26',
    );
    expect(
      generatedEventDay('2026-11-26T08:00:00.000Z', 'America/Los_Angeles'),
    ).toBe('2026-11-26');
  });
});

describe('generatedEventWindow duration', () => {
  it('uses the goal duration', () => {
    const { startDate, endDate } = generatedEventWindow(
      '2026-11-26',
      'Europe/Paris',
      2700,
    );
    expect(endDate.getTime() - startDate.getTime()).toBe(2700 * 1000);
  });

  it('defaults to one hour', () => {
    const { startDate, endDate } = generatedEventWindow(
      '2026-11-26',
      'Europe/Paris',
      null,
    );
    expect(endDate.getTime() - startDate.getTime()).toBe(60 * 60 * 1000);
  });
});
