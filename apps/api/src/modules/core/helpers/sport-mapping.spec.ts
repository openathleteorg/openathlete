import { SportType } from '@openathlete/database';

import {
  extractGarminFitRpe,
  mapGarminActivityType,
  mapGarminRpe,
} from './garmin';
import { fitSport } from './manual-fit-import';
import { stravaActivitySport } from './strava';
import { mapSuuntoActivityId } from './suunto';

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

describe('martial arts sport mapping', () => {
  it('reads Garmin mixed martial arts as martial arts, not rock climbing', () => {
    expect(mapGarminActivityType('MIXED_MARTIAL_ARTS')).toBe(
      SportType.MARTIAL_ARTS,
    );
    expect(mapGarminActivityType('ROCK_CLIMBING')).toBe(
      SportType.ROCK_CLIMBING,
    );
    expect(mapGarminActivityType('BOXING')).toBe(SportType.OTHER);
  });

  it('reads mixed martial arts FIT files (sport 80) as martial arts', () => {
    expect(fitSport(80, 0)).toBe(SportType.MARTIAL_ARTS);
    expect(fitSport('mixedMartialArts', 'generic')).toBe(
      SportType.MARTIAL_ARTS,
    );
  });

  it('reads Suunto combat sports as martial arts', () => {
    expect(mapSuuntoActivityId(62)).toBe(SportType.MARTIAL_ARTS);
    expect(mapSuuntoActivityId(77)).toBe(SportType.OTHER); // Boxing
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

describe('Garmin RPE mapping', () => {
  it('maps Garmin 0-100 workoutRpe values to OpenAthlete 0.0-1.0 scale', () => {
    expect(mapGarminRpe(10)).toBe(0.1);
    expect(mapGarminRpe(50)).toBe(0.5);
    expect(mapGarminRpe(70)).toBe(0.7);
    expect(mapGarminRpe(100)).toBe(1);
  });

  it('ignores unset or out-of-range Garmin RPE values', () => {
    expect(mapGarminRpe(0)).toBeUndefined();
    expect(mapGarminRpe(-10)).toBeUndefined();
    expect(mapGarminRpe(101)).toBeUndefined();
    expect(mapGarminRpe(255)).toBeUndefined();
    expect(mapGarminRpe(undefined)).toBeUndefined();
    expect(mapGarminRpe(null)).toBeUndefined();
  });

  it('extracts workoutRpe from decoded FIT session messages', () => {
    expect(extractGarminFitRpe([{ workoutRpe: 80 }])).toBe(0.8);
    expect(extractGarminFitRpe([{}, { workoutRpe: 60 }])).toBe(0.6);
    expect(extractGarminFitRpe([{ workoutRpe: 0 }])).toBeUndefined();
    expect(extractGarminFitRpe([])).toBeUndefined();
    expect(extractGarminFitRpe(undefined)).toBeUndefined();
  });
});
