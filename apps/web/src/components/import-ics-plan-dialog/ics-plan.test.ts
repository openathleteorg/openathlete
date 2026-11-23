import { describe, expect, it } from 'vitest';

import { parseIcsSessions } from './ics-plan';

const ics = (...events: string[]) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Example//Plan//EN',
    ...events.flatMap((event) => ['BEGIN:VEVENT', event, 'END:VEVENT']),
    'END:VCALENDAR',
    '',
  ].join('\r\n');

describe('parseIcsSessions', () => {
  it('reads an all-day session as noon on its day, for an hour', () => {
    const [session] = parseIcsSessions(
      ics(
        'DTSTART;VALUE=DATE:20261207\r\nSUMMARY:Easy run 40 min\r\nDESCRIPTION:Zone 2\\, flat.\\nStrides at the end.',
      ),
    );
    expect(session).toMatchObject({
      name: 'Easy run 40 min',
      description: 'Zone 2, flat.\nStrides at the end.',
      allDay: true,
    });
    expect(session.start).toEqual(new Date(2026, 11, 7, 12));
    expect(session.end).toEqual(new Date(2026, 11, 7, 13));
  });

  it('keeps the time and length of a timed session', () => {
    const [utc, local] = parseIcsSessions(
      ics(
        'DTSTART:20261208T063000Z\r\nDTEND:20261208T074500Z\r\nSUMMARY:Intervals',
        'DTSTART;TZID=Europe/Paris:20261209T180000\r\nDURATION:PT1H30M\r\nSUMMARY:Long ride',
      ),
    );
    expect(utc.start.toISOString()).toBe('2026-12-08T06:30:00.000Z');
    expect(utc.end.toISOString()).toBe('2026-12-08T07:45:00.000Z');
    expect(local.start).toEqual(new Date(2026, 11, 9, 18));
    expect(local.end).toEqual(new Date(2026, 11, 9, 19, 30));
  });

  it('joins folded lines and sorts sessions by date', () => {
    const sessions = parseIcsSessions(
      ics(
        'DTSTART;VALUE=DATE:20261210\r\nSUMMARY:Second',
        'DTSTART;VALUE=DATE:20261201\r\nSUMMARY:First with a very long\r\n  title',
      ),
    );
    expect(sessions.map((s) => s.name)).toEqual([
      'First with a very long title',
      'Second',
    ]);
  });

  it('leaves out cancelled events and events without a start', () => {
    expect(
      parseIcsSessions(
        ics(
          'DTSTART;VALUE=DATE:20261201\r\nSUMMARY:Gone\r\nSTATUS:CANCELLED',
          'SUMMARY:No date',
        ),
      ),
    ).toEqual([]);
    expect(parseIcsSessions('not a calendar')).toEqual([]);
  });
});
