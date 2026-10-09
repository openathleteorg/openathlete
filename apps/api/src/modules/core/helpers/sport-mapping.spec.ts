import { SportType } from '@openathlete/database';

import { mapGarminActivityType } from './garmin';
import { fitSport } from './manual-fit-import';
import { stravaActivitySport } from './strava';

describe('mobility sport mapping', () => {
  it('keeps Garmin mobility and Pilates apart', () => {
    expect(mapGarminActivityType('MOBILITY')).toBe(SportType.MOBILITY);
    expect(mapGarminActivityType('PILATES')).toBe(SportType.PILATES);
  });

  it('reads Garmin mobility FIT files (sport 86) as mobility', () => {
    expect(fitSport(86, 0)).toBe(SportType.MOBILITY);
    expect(fitSport('mobility', 'generic')).toBe(SportType.MOBILITY);
    expect(fitSport(10, 44)).toBe(SportType.PILATES);
  });
});

describe('Strava sport mapping', () => {
  it('reads the detailed sport_type, not the type that folds it', () => {
    // What Strava sends for a trail run: type is still "Run"
    expect(stravaActivitySport({ type: 'Run', sport_type: 'TrailRun' })).toBe(
      SportType.TRAIL_RUNNING,
    );
    expect(
      stravaActivitySport({ type: 'Ride', sport_type: 'GravelRide' }),
    ).toBe(SportType.GRAVEL_RIDE);
    expect(
      stravaActivitySport({ type: 'Ride', sport_type: 'MountainBikeRide' }),
    ).toBe(SportType.MOUNTAIN_BIKE_RIDE);
  });

  it('falls back on type for payloads without sport_type', () => {
    expect(stravaActivitySport({ type: 'Run' })).toBe(SportType.RUNNING);
    expect(stravaActivitySport({})).toBe(SportType.OTHER);
  });
});
