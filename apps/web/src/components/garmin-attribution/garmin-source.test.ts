import { describe, expect, it, vi } from 'vitest';

import { EVENT_TYPE, Event } from '@openathlete/shared';

import { garminActivityLabel, garminSourceLabel } from './garmin-source';

// The hooks' API client needs a browser; these helpers don't
vi.mock('@/api/athlete', () => ({}));

const activity = (fields: Record<string, unknown>) =>
  ({ type: EVENT_TYPE.ACTIVITY, ...fields }) as unknown as Event;

describe('garminSourceLabel', () => {
  it('names the device, as Garmin requires', () => {
    expect(garminSourceLabel('Forerunner 965')).toBe('Garmin Forerunner 965');
  });

  it('falls back to Garmin alone when the device is unknown', () => {
    expect(garminSourceLabel(null)).toBe('Garmin');
    expect(garminSourceLabel(undefined)).toBe('Garmin');
  });
});

describe('garminActivityLabel', () => {
  it('attributes activities imported from Garmin', () => {
    expect(
      garminActivityLabel(
        activity({ provider: 'GARMIN', deviceName: 'fenix 8' }),
      ),
    ).toBe('Garmin fenix 8');
  });

  it('leaves other activities and planned sessions alone', () => {
    expect(
      garminActivityLabel(
        activity({ provider: 'STRAVA', deviceName: 'fenix 8' }),
      ),
    ).toBeNull();
    expect(
      garminActivityLabel({
        type: EVENT_TYPE.TRAINING,
      } as unknown as Event),
    ).toBeNull();
  });
});
