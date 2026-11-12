import { describe, expect, it } from 'vitest';

import {
  SPORT_TYPE,
  WORKOUT_TARGET_TYPE as T,
  TRAINING_ZONE_TYPE,
} from '@openathlete/shared';

import type { ZonesByType } from '../workout/workout-profile';
import { describeTarget, formatSportSpeed } from './step-format';

const zonesByType: ZonesByType = {
  [TRAINING_ZONE_TYPE.HEARTRATE]: [
    { id: 11, name: 'Z1', color: 'grey', min: 0, max: 131, index: 0 },
    { id: 12, name: 'Z2', color: 'green', min: 132, max: 142, index: 1 },
    { id: 15, name: 'Z5', color: 'red', min: 164, max: 255, index: 4 },
  ],
  [TRAINING_ZONE_TYPE.POWER]: [
    { id: 21, name: 'Z1', color: 'grey', min: 0, max: 150, index: 0 },
  ],
  [TRAINING_ZONE_TYPE.PACE]: [
    { id: 31, name: 'Z4', color: 'orange', min: 4.25, max: 4.0, index: 3 },
  ],
};
const metrics = { VMA: { value: 18 }, FTP_CYCLING: { value: 250 } };
const describe_ = (
  target: Parameters<typeof describeTarget>[0],
  sport = SPORT_TYPE.RUNNING,
) => describeTarget(target, sport, zonesByType, metrics);

describe('formatSportSpeed', () => {
  it('writes paces for running and swimming, speeds for cycling', () => {
    expect(formatSportSpeed(1000 / 270, SPORT_TYPE.RUNNING)).toBe('4:30/km');
    expect(formatSportSpeed(1, SPORT_TYPE.SWIMMING)).toBe('1:40/100m');
    expect(formatSportSpeed(10, SPORT_TYPE.CYCLING)).toBe('36.0 km/h');
  });
});

describe('describeTarget', () => {
  it('names zones with their bounds and colour', () => {
    expect(describe_({ targetType: T.ZONE, targetValue: 12 })).toEqual({
      primary: 'Z2 FC',
      secondary: '132–142 bpm',
      kind: 'hr',
      color: 'green',
      zoneIndex: 1,
    });
    expect(describe_({ targetType: T.ZONE, targetValue: 15 })?.secondary).toBe(
      '> 164 bpm',
    );
    expect(describe_({ targetType: T.ZONE, targetValue: 31 })?.secondary).toBe(
      '4:00–4:15/km',
    );
  });

  it('gives what a percentage means for the athlete', () => {
    expect(
      describe_({ targetType: T.PACE, targetValue: 1, metricType: 'VMA' }),
    ).toMatchObject({ primary: '100% VMA', secondary: '3:20/km' });
    expect(
      describe_(
        {
          targetType: T.POWER,
          targetMin: 0.9,
          targetMax: 1,
          metricType: 'FTP_CYCLING',
        },
        SPORT_TYPE.CYCLING,
      ),
    ).toMatchObject({ primary: '90–100% FTP', secondary: '225–250 W' });
  });

  it('writes absolute targets, the faster pace first', () => {
    expect(
      describe_({
        targetType: T.PACE,
        targetMin: 1000 / 240,
        targetMax: 1000 / 230,
      }),
    ).toMatchObject({ primary: '3:50–4:00/km' });
    expect(describe_({ targetType: T.POWER, targetValue: 250 })?.primary).toBe(
      '250 W',
    );
    expect(describe_({ targetType: T.RPE, targetValue: 7 })?.primary).toBe(
      'RPE 7',
    );
  });

  it('says nothing of a zone the athlete does not have', () => {
    expect(describe_({ targetType: T.ZONE, targetValue: 99 })).toBeNull();
  });
});
