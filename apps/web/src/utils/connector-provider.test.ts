import { describe, expect, it } from 'vitest';

import { getConnectorProviderActivityLink } from './connector-provider';

describe('getConnectorProviderActivityLink', () => {
  it('links Garmin activities to Garmin Connect', () => {
    expect(getConnectorProviderActivityLink('GARMIN', '123456')).toBe(
      'https://connect.garmin.com/modern/activity/123456',
    );
  });

  it('has no link for Garmin Personal API imports', () => {
    expect(
      getConnectorProviderActivityLink('GARMIN', 'garmin-personal:12:987654'),
    ).toBeUndefined();
  });
});
