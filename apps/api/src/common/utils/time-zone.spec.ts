import {
  addDaysToDateKey,
  addZonedDays,
  formatZoned,
  startOfZonedDay,
  validTimeZone,
  zonedClock,
  zonedInstant,
} from './time-zone';

describe('time zones', () => {
  it('reads the local date and hour', () => {
    const instant = new Date('2026-10-09T17:30:00Z');
    expect(zonedClock(instant, 'Europe/Paris')).toEqual({
      date: '2026-10-09',
      hour: 19,
    });
    expect(zonedClock(instant, 'Asia/Tokyo')).toEqual({
      date: '2026-10-10',
      hour: 2,
    });
    expect(zonedClock(instant, 'America/New_York')).toEqual({
      date: '2026-10-09',
      hour: 13,
    });
    expect(zonedClock(instant, 'UTC')).toEqual({
      date: '2026-10-09',
      hour: 17,
    });
  });

  it('finds when a local day starts', () => {
    expect(startOfZonedDay('2026-10-10', 'Europe/Paris').toISOString()).toBe(
      '2026-10-09T22:00:00.000Z',
    );
    expect(startOfZonedDay('2026-10-10', 'Asia/Tokyo').toISOString()).toBe(
      '2026-10-09T15:00:00.000Z',
    );
    expect(
      startOfZonedDay('2026-10-10', 'America/New_York').toISOString(),
    ).toBe('2026-10-10T04:00:00.000Z');
    expect(startOfZonedDay('2026-10-10', 'UTC').toISOString()).toBe(
      '2026-10-10T00:00:00.000Z',
    );
  });

  it('follows daylight saving changes', () => {
    // Paris moves to winter time on 25 October 2026 at 3:00
    expect(startOfZonedDay('2026-10-25', 'Europe/Paris').toISOString()).toBe(
      '2026-10-24T22:00:00.000Z',
    );
    expect(startOfZonedDay('2026-10-26', 'Europe/Paris').toISOString()).toBe(
      '2026-10-25T23:00:00.000Z',
    );
    // New York moves to summer time on 8 March 2026 at 2:00
    expect(
      startOfZonedDay('2026-03-08', 'America/New_York').toISOString(),
    ).toBe('2026-03-08T05:00:00.000Z');
    expect(
      startOfZonedDay('2026-03-09', 'America/New_York').toISOString(),
    ).toBe('2026-03-09T04:00:00.000Z');
  });

  it('adds days to a date across months and years', () => {
    expect(addDaysToDateKey('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysToDateKey('2026-12-31', 2)).toBe('2027-01-02');
  });

  it('moves by calendar days at the same local time across DST', () => {
    // Saturday 24 October 2026, 7:00 in Paris (UTC+2); summer time ends
    // the next night, so a week later 7:00 is UTC+1
    const saturday = new Date('2026-10-24T05:00:00Z');
    expect(addZonedDays(saturday, 7, 'Europe/Paris')).toEqual(
      new Date('2026-10-31T06:00:00Z'),
    );
    expect(
      addZonedDays(new Date('2026-10-31T06:00:00Z'), -7, 'Europe/Paris'),
    ).toEqual(saturday);
    // Without DST in between, plain days
    expect(addZonedDays(saturday, 2, 'Europe/Paris')).toEqual(
      new Date('2026-10-26T06:00:00Z'),
    );
    expect(addZonedDays(saturday, 3, 'UTC')).toEqual(
      new Date('2026-10-27T05:00:00Z'),
    );
  });

  it('keeps the milliseconds', () => {
    const instant = new Date('2026-03-01T10:00:00.250Z');
    expect(addZonedDays(instant, 1, 'Europe/Paris').toISOString()).toBe(
      '2026-03-02T10:00:00.250Z',
    );
  });

  it('finds the instant of a local time, on both sides of a DST change', () => {
    expect(zonedInstant('2026-10-24', '18:00', 'Europe/Paris')).toEqual(
      new Date('2026-10-24T16:00:00Z'),
    );
    expect(zonedInstant('2026-10-26', '07:30', 'Europe/Paris')).toEqual(
      new Date('2026-10-26T06:30:00Z'),
    );
    expect(zonedInstant('2026-10-12', '06:00', 'America/New_York')).toEqual(
      new Date('2026-10-12T10:00:00Z'),
    );
  });

  it('formats an instant in local time with its offset', () => {
    const instant = new Date('2026-10-24T16:00:00Z');
    expect(formatZoned(instant, 'Europe/Paris')).toBe('2026-10-24T18:00+02:00');
    expect(formatZoned(instant, 'America/New_York')).toBe(
      '2026-10-24T12:00-04:00',
    );
    expect(formatZoned(instant, 'Asia/Kolkata')).toBe('2026-10-24T21:30+05:30');
    expect(formatZoned(instant, 'UTC')).toBe('2026-10-24T16:00+00:00');
  });

  it('falls back to UTC for an unknown time zone', () => {
    expect(validTimeZone('Europe/Paris')).toBe('Europe/Paris');
    expect(validTimeZone('Mars/Olympus')).toBe('UTC');
    expect(validTimeZone(null)).toBe('UTC');
  });
});
