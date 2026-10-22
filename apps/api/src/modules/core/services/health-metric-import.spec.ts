import { importHealthMetricsDtoSchema } from '@openathlete/shared';

const metric = {
  type: 'HRV_SDNN',
  date: '2026-10-19',
  unit: 'ms',
  value: 42.5,
};
const payload = (metrics: unknown[] = [metric]) => ({
  source: 'APPLE_HEALTH',
  timeZone: 'Europe/Berlin',
  metrics,
});

describe('health metric import validation', () => {
  it('accepts recovery and body metrics with explicit units and zero sleep/body fat', () => {
    expect(
      importHealthMetricsDtoSchema.safeParse(
        payload([
          { ...metric, sampleCount: 10 },
          { ...metric, type: 'HR_REST', unit: 'bpm', value: 55 },
          { ...metric, type: 'SLEEP_DURATION', unit: 'h', value: 0 },
          { ...metric, type: 'WEIGHT', unit: 'kg', value: 72.345 },
          { ...metric, type: 'BODY_FAT', unit: '%', value: 0 },
        ]),
      ).success,
    ).toBe(true);
  });

  it.each([
    { ...metric, type: 'RMSSD' },
    { ...metric, unit: 's' },
    { ...metric, value: '42.5' },
    { ...metric, value: -1 },
    { ...metric, value: 0 },
    { ...metric, value: Infinity },
    { ...metric, date: '2026-02-30' },
    { ...metric, date: '2026-10-19T00:00:00Z' },
    { ...metric, sampleCount: 0 },
    { ...metric, athleteId: 999 },
    { ...metric, type: 'SLEEP_DURATION', unit: 'h', value: 26 },
    { ...metric, type: 'WEIGHT', unit: 'lb', value: 72 },
    { ...metric, type: 'WEIGHT', unit: 'kg', value: 0 },
    { ...metric, type: 'BODY_FAT', unit: '%', value: 100.1 },
    { ...metric, type: 'BODY_FAT', unit: '%', value: -0.1 },
    { ...metric, type: 'BODY_FAT', unit: 'kg', value: 20 },
  ])('rejects invalid metric %j', (entry) => {
    expect(
      importHealthMetricsDtoSchema.safeParse(payload([entry])).success,
    ).toBe(false);
  });

  it('rejects ambiguous duplicate summaries rather than silently picking one', () => {
    expect(
      importHealthMetricsDtoSchema.safeParse(
        payload([metric, { ...metric, value: 50 }]),
      ).success,
    ).toBe(false);
  });

  it('bounds batch sizes and rejects unknown time zones and target accounts', () => {
    for (const input of [
      payload([]),
      payload(
        Array.from({ length: 501 }, (_, index) => ({
          ...metric,
          date: new Date(Date.UTC(2024, 0, index + 1))
            .toISOString()
            .slice(0, 10),
        })),
      ),
      { ...payload(), timeZone: 'Not/AZone' },
      { ...payload(), timeZone: '+01:00' },
      { ...payload(), athleteId: 999 },
    ]) {
      expect(importHealthMetricsDtoSchema.safeParse(input).success).toBe(false);
    }
  });

  it('accepts leap dates and preserves the caller’s date across time zones', () => {
    const result = importHealthMetricsDtoSchema.parse({
      ...payload([{ ...metric, date: '2024-02-29' }]),
      timeZone: 'Pacific/Kiritimati',
    });
    expect(result.metrics[0].date).toBe('2024-02-29');
  });
});
