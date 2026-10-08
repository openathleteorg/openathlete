import { SportType } from '@openathlete/database';

import { mapGarminActivityType } from './garmin';
import { fitSport } from './manual-fit-import';

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
