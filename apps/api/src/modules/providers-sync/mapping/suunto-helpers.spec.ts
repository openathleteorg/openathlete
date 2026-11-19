import { SportType } from '@openathlete/database';

import { mapSportToSuuntoActivityIds } from './suunto-helpers';

describe('mapSportToSuuntoActivityIds', () => {
  const RUNNING_MODES = [1, 22, 53, 59, 60];
  const CYCLING_MODES = [2, 10, 52, 99];

  it.each([SportType.RUNNING, SportType.TRAIL_RUNNING, SportType.VIRTUAL_RUN])(
    'offers a %s workout in every running mode',
    (sport) => {
      expect(
        [...mapSportToSuuntoActivityIds(sport)].sort((a, b) => a - b),
      ).toEqual(RUNNING_MODES);
    },
  );

  it.each([
    SportType.CYCLING,
    SportType.VIRTUAL_RIDE,
    SportType.MOUNTAIN_BIKE_RIDE,
    SportType.GRAVEL_RIDE,
    SportType.E_BIKE_RIDE,
    SportType.E_MOUNTAIN_BIKE_RIDE,
    SportType.HANDCYCLE,
  ])('offers a %s workout in every cycling mode', (sport) => {
    expect(
      [...mapSportToSuuntoActivityIds(sport)].sort((a, b) => a - b),
    ).toEqual(CYCLING_MODES);
  });

  it('lists the modes of the planned sport first', () => {
    expect(mapSportToSuuntoActivityIds(SportType.RUNNING)).toEqual([
      1, 53, 59, 60, 22,
    ]);
    expect(mapSportToSuuntoActivityIds(SportType.TRAIL_RUNNING)).toEqual([
      22, 1, 53, 59, 60,
    ]);
    expect(mapSportToSuuntoActivityIds(SportType.GRAVEL_RIDE)[0]).toBe(99);
  });

  it('keeps other sports to their own modes', () => {
    expect(mapSportToSuuntoActivityIds(SportType.SWIMMING)).toEqual([
      21, 85, 90,
    ]);
    expect(mapSportToSuuntoActivityIds(SportType.HIKING)).toEqual([11, 70]);
  });
});
