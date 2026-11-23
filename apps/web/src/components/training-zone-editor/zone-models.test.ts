import { describe, expect, it } from 'vitest';

import { SPORT_TYPE, TRAINING_ZONE_TYPE } from '@openathlete/shared';

import {
  customTable,
  defaultCustomLimits,
  zoneModelChoices,
  zoneModelSport,
} from './zone-models';

const authors = (type: TRAINING_ZONE_TYPE, sports: string[]) =>
  zoneModelChoices(type, sports).map(
    ({ model, table }) => `${model.id}${table.sport ? `-${table.sport}` : ''}`,
  );

describe('zoneModelChoices', () => {
  it('offers running power the models made for it', () => {
    expect(authors(TRAINING_ZONE_TYPE.POWER, [SPORT_TYPE.RUNNING])).toEqual([
      'palladino-run',
      'vance-run',
      'stryd-run',
    ]);
  });

  it("offers cycling power Friel's and Coggan's zones", () => {
    expect(authors(TRAINING_ZONE_TYPE.POWER, [SPORT_TYPE.GRAVEL_RIDE])).toEqual(
      ['friel-bike', 'coggan-bike'],
    );
  });

  it('offers heart rate by sport, and everything for a mixed set', () => {
    expect(
      authors(TRAINING_ZONE_TYPE.HEARTRATE, [SPORT_TYPE.TRAIL_RUNNING]),
    ).toEqual(['friel-run']);
    expect(
      authors(TRAINING_ZONE_TYPE.HEARTRATE, [
        SPORT_TYPE.RUNNING,
        SPORT_TYPE.CYCLING,
      ]),
    ).toEqual(['friel-run', 'friel-bike', 'coggan-bike']);
  });

  it('offers pace the running models', () => {
    expect(authors(TRAINING_ZONE_TYPE.PACE, [SPORT_TYPE.RUNNING])).toEqual([
      'friel-run',
    ]);
  });

  it('keeps running and cycling power apart', () => {
    expect(
      authors(TRAINING_ZONE_TYPE.POWER, [SPORT_TYPE.RUNNING]).some((id) =>
        id.endsWith('-bike'),
      ),
    ).toBe(false);
    expect(
      authors(TRAINING_ZONE_TYPE.POWER, [SPORT_TYPE.CYCLING]).some((id) =>
        id.endsWith('-run'),
      ),
    ).toBe(false);
  });

  it('offers nothing published for sports no model covers', () => {
    expect(
      authors(TRAINING_ZONE_TYPE.HEARTRATE, [SPORT_TYPE.SWIMMING]),
    ).toEqual(['friel-run', 'friel-bike', 'coggan-bike']);
    expect(authors(TRAINING_ZONE_TYPE.PACE, [SPORT_TYPE.CYCLING])).toEqual([]);
  });
});

describe('zoneModelSport', () => {
  it('reads a set of sports as running, cycling or both', () => {
    expect(zoneModelSport([SPORT_TYPE.RUNNING, SPORT_TYPE.VIRTUAL_RUN])).toBe(
      'run',
    );
    expect(zoneModelSport([SPORT_TYPE.MOUNTAIN_BIKE_RIDE])).toBe('bike');
    expect(zoneModelSport([SPORT_TYPE.RUNNING, SPORT_TYPE.CYCLING])).toBeNull();
    expect(zoneModelSport([SPORT_TYPE.SWIMMING])).toBeNull();
  });
});

describe('custom zones', () => {
  it('start from the first model of the type, merged', () => {
    // Friel's run heart rate: 85, 90, 95, 100 %
    expect(
      defaultCustomLimits(TRAINING_ZONE_TYPE.HEARTRATE, [SPORT_TYPE.RUNNING]),
    ).toEqual([0.85, 0.9, 0.95, 1]);
    // Palladino's running power, merged: 81, 88, 95, 106 %
    expect(
      defaultCustomLimits(TRAINING_ZONE_TYPE.POWER, [SPORT_TYPE.RUNNING]),
    ).toEqual([0.81, 0.88, 0.95, 1.06]);
    // No pace model for cycling: Friel's limits all the same
    expect(
      defaultCustomLimits(TRAINING_ZONE_TYPE.PACE, [SPORT_TYPE.CYCLING]),
    ).toEqual([1.29, 1.14, 1.06, 0.99]);
  });

  it('make five zones from four limits in order', () => {
    expect(
      customTable(TRAINING_ZONE_TYPE.POWER, [0.6, 0.8, 0.95, 1.05]),
    ).toMatchObject({ starts: [0, 0.6, 0.8, 0.95, 1.05] });
    expect(
      customTable(TRAINING_ZONE_TYPE.PACE, [1.3, 1.15, 1.05, 0.98]),
    ).toMatchObject({ paceLimits: [1.3, 1.15, 1.05, 0.98] });
    expect(
      customTable(TRAINING_ZONE_TYPE.POWER, [0.8, 0.6, 0.95, 1.05]),
    ).toBeNull();
    expect(
      customTable(TRAINING_ZONE_TYPE.PACE, [0.98, 1.05, 1.15, 1.3]),
    ).toBeNull();
    expect(
      customTable(TRAINING_ZONE_TYPE.HEARTRATE, [0, 0.8, 0.9, 1]),
    ).toBeNull();
    expect(customTable(TRAINING_ZONE_TYPE.HEARTRATE, [0.8, 0.9, 1])).toBeNull();
  });
});
