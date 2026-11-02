import { ApiEnvSchema } from '@openathlete/shared';

describe('Garmin Personal opt-in configuration', () => {
  it('enables only explicit true and remains off for unset, empty or false values', () => {
    const flag = ApiEnvSchema.innerType().shape.GARMIN_PERSONAL_API_ENABLED;
    for (const value of [undefined, '', 'false', '0', 'TRUE'])
      expect(flag.parse(value)).toBe(false);
    expect(flag.parse('true')).toBe(true);
  });
});
