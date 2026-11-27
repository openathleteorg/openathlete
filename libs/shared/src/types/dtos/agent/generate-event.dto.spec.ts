import { describe, expect, it } from 'vitest';

import { generateEventDtoSchema } from './generate-event.dto';

const request = { prompt: 'A 45-minute interval run' };

describe('generateEventDtoSchema', () => {
  it('accepts the local calendar day new clients send', () => {
    expect(
      generateEventDtoSchema.parse({
        ...request,
        date: '2026-11-26',
        timeZone: 'Europe/Paris',
      }),
    ).toMatchObject({ date: '2026-11-26', timeZone: 'Europe/Paris' });
  });

  it('still accepts the ISO instant older clients sent', () => {
    expect(
      generateEventDtoSchema.parse({
        ...request,
        date: '2026-11-25T23:00:00.000Z',
      }).date,
    ).toBe('2026-11-25T23:00:00.000Z');
  });

  it('rejects a value that is not a calendar day or an instant', () => {
    expect(() =>
      generateEventDtoSchema.parse({ ...request, date: 'next thursday' }),
    ).toThrow();
    expect(() =>
      generateEventDtoSchema.parse({ ...request, date: '2026-02-31' }),
    ).toThrow();
  });

  it('rejects an unknown time zone', () => {
    expect(() =>
      generateEventDtoSchema.parse({
        ...request,
        date: '2026-11-26',
        timeZone: 'Mars/Olympus_Mons',
      }),
    ).toThrow();
  });
});
