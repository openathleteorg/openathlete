import { describe, expect, it } from 'vitest';

import {
  METRIC_TYPE,
  SPORT_TYPE,
  formatDistance,
  formatSpeed,
  formatSpeedUnit,
  getDefaultUnitSystem,
  getSpeedUnitForSport,
  localSpeedUnit,
  metricDisplayUnit,
  metricFromDisplay,
  metricToDisplay,
  paceDistanceMeters,
  toUnitElevation,
  toUnitTemperature,
  toUnitWeight,
} from '@openathlete/shared';

import { unitsFor } from './units';

describe('unit conversions', () => {
  it('converts weight and elevation', () => {
    expect(toUnitWeight(70, 'METRIC')).toEqual({ value: 70, unit: 'kg' });
    expect(toUnitWeight(70, 'IMPERIAL')).toEqual({ value: 154.3, unit: 'lb' });
    expect(toUnitElevation(100, 'METRIC')).toEqual({ value: 100, unit: 'm' });
    expect(toUnitElevation(100, 'IMPERIAL')).toEqual({
      value: 328,
      unit: 'ft',
    });
  });

  it('converts temperature with its offset', () => {
    expect(toUnitTemperature(20, 'METRIC')).toEqual({ value: 20, unit: '°C' });
    expect(toUnitTemperature(20, 'IMPERIAL')).toEqual({
      value: 68,
      unit: '°F',
    });
  });

  it('converts a distance to yards', () => {
    expect(formatDistance(100, 'yd')).toBe('109');
  });

  it('shows a sport in the unit of the system', () => {
    expect(localSpeedUnit('km/h', 'IMPERIAL')).toBe('mph');
    expect(localSpeedUnit('min/km', 'IMPERIAL')).toBe('min/mi');
    expect(localSpeedUnit('min/km', 'METRIC')).toBe('min/km');
    expect(getSpeedUnitForSport(SPORT_TYPE.RUNNING, 'IMPERIAL')).toBe('min/mi');
    expect(getSpeedUnitForSport(SPORT_TYPE.RUNNING)).toBe('min/km');
  });

  it('keeps swim and rowing paces over their usual distances', () => {
    expect(localSpeedUnit('min/100m', 'IMPERIAL')).toBe('min/100m');
    expect(localSpeedUnit('min/500m', 'IMPERIAL')).toBe('min/500m');
  });

  it('names mph, and splits imperial speeds per mile', () => {
    expect(formatSpeedUnit('mph')).toBe('mph');
    expect(paceDistanceMeters('mph')).toBe(1609.34);
    expect(paceDistanceMeters('km/h')).toBe(1000);
  });
});

describe('units of a screen', () => {
  const metric = unitsFor('METRIC');
  const imperial = unitsFor('IMPERIAL');

  it('shows distances in km or miles', () => {
    expect(metric.formatDist(5000)).toBe('5.00');
    expect(imperial.formatDist(1609.34)).toBe('1.00');
    expect(metric.distanceLabel).toBe('km');
    expect(imperial.distanceLabel).toBe('mi');
  });

  it('shows pool distances in yards, in imperial only', () => {
    expect(imperial.formatSportDist(100, 'min/100m')).toBe('109 yd');
    expect(imperial.formatSportDist(1609.34, 'min/km')).toBe('1.00 mi');
    expect(metric.formatSportDist(1000, 'min/100m')).toBe('1.00 km');
  });

  it('shows elevation in metres or feet', () => {
    expect(metric.elevation(100)).toBe(100);
    expect(imperial.elevation(100)).toBe(328);
  });

  it('shows a speed given in km/h', () => {
    expect(metric.formatKmh(12)).toBe('12 km/h');
    expect(imperial.formatKmh(12)).toBe('7.5 mph');
  });

  it('shows a temperature', () => {
    expect(metric.formatTemp(20)).toBe('20.0 °C');
    expect(imperial.formatTemp(20)).toBe('68.0 °F');
  });
});

describe('body metrics', () => {
  it('converts what has an imperial unit', () => {
    expect(metricDisplayUnit(METRIC_TYPE.WEIGHT, 'IMPERIAL')).toBe('lb');
    expect(metricDisplayUnit(METRIC_TYPE.HEIGHT, 'IMPERIAL')).toBe('in');
    expect(metricDisplayUnit(METRIC_TYPE.DAILY_DISTANCE, 'IMPERIAL')).toBe(
      'mi',
    );
    expect(metricDisplayUnit(METRIC_TYPE.VMA, 'IMPERIAL')).toBe('mph');
    expect(metricToDisplay(METRIC_TYPE.WEIGHT, 100, 'IMPERIAL')).toBeCloseTo(
      220.462,
    );
  });

  it('converts a temperature deviation without an offset', () => {
    expect(
      metricToDisplay(METRIC_TYPE.SKIN_TEMP_DEVIATION, 1, 'IMPERIAL'),
    ).toBeCloseTo(1.8);
  });

  it('leaves ratios and metric users alone', () => {
    expect(metricDisplayUnit(METRIC_TYPE.BMI, 'IMPERIAL')).toBe('kg/m²');
    expect(metricToDisplay(METRIC_TYPE.BMI, 22, 'IMPERIAL')).toBe(22);
    expect(metricDisplayUnit(METRIC_TYPE.WEIGHT, 'METRIC')).toBe('kg');
    expect(metricToDisplay(METRIC_TYPE.WEIGHT, 70, 'METRIC')).toBe(70);
  });

  it('stores what is typed in the metric unit', () => {
    const stored = metricFromDisplay(METRIC_TYPE.WEIGHT, 154, 'IMPERIAL');
    expect(stored).toBeCloseTo(69.85, 2);
    expect(metricToDisplay(METRIC_TYPE.WEIGHT, stored, 'IMPERIAL')).toBeCloseTo(
      154,
    );
  });
});

describe('default unit system', () => {
  it('is imperial for US English, in any case', () => {
    expect(getDefaultUnitSystem('en-US')).toBe('IMPERIAL');
    expect(getDefaultUnitSystem('en-us')).toBe('IMPERIAL');
  });

  it('is metric otherwise', () => {
    expect(getDefaultUnitSystem('fr-FR')).toBe('METRIC');
    expect(getDefaultUnitSystem('en-GB')).toBe('METRIC');
    expect(getDefaultUnitSystem()).toBe('METRIC');
  });
});

// Existing callers rely on these signatures and strings
describe('existing formatters', () => {
  it('still return strings', () => {
    expect(formatDistance(5000)).toBe('5.00');
    expect(formatSpeed(10, 'km/h')).toBe('36.00');
  });
});
