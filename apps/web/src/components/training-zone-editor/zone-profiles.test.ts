import { describe, expect, it, vi } from 'vitest';

import { SPORT_TYPE } from '@openathlete/shared';

import { ALL_SPORTS } from './sport-summary';
import {
  ZoneDraft,
  ZoneProfile,
  assignSports,
  dropProfile,
  formatPace,
  groupZoneProfiles,
  moveLimit,
  nextZoneName,
  parsePace,
  removeZone,
  splitLastZone,
} from './zone-profiles';

vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

const zone = (min: number, max: number, name = 'Zone 1'): ZoneDraft => ({
  key: min,
  name,
  description: '',
  min,
  max,
  color: '#22C55E',
});
const bounds = (zones: ZoneDraft[]) => zones.map(({ min, max }) => [min, max]);
const { RUNNING, CYCLING } = SPORT_TYPE;

describe('pace', () => {
  it('reads and writes minutes and seconds', () => {
    expect(formatPace(5.9)).toBe('5:54');
    expect(formatPace(6)).toBe('6:00');
    expect(formatPace(4.9999)).toBe('5:00');
    expect(parsePace('5:30')).toBe(5.5);
    expect(formatPace(parsePace('4:07')!)).toBe('4:07');
  });

  it('refuses what is not yet a pace', () => {
    for (const text of ['', '5', '5:', '5:6', '5:75', 'abc']) {
      expect(parsePace(text)).toBeNull();
    }
  });
});

describe('zone limits', () => {
  it('starts the next zone after the limit of this one', () => {
    const zones = [zone(100, 119), zone(120, 139), zone(140, 200)];
    expect(bounds(moveLimit(zones, 0, 'max', 124, 1))).toEqual([
      [100, 124],
      [125, 139],
      [140, 200],
    ]);
  });

  it('shares the boundary of percentages', () => {
    const zones = [zone(50, 60), zone(60, 70)];
    expect(bounds(moveLimit(zones, 0, 'max', 65, 0))[1]).toEqual([65, 70]);
  });

  it('goes the other way on paces, slow to fast', () => {
    const zones = [zone(6, 7), zone(5, 5.9), zone(4, 4.9)];
    const moved = moveLimit(zones, 0, 'min', 5.5, 1 / 60);
    expect(moved[0].min).toBe(5.5);
    expect(formatPace(moved[1].max)).toBe('5:29');
    expect(moved[1].min).toBe(5);
  });

  it('leaves the neighbour alone while the field is empty', () => {
    const zones = [zone(100, 119), zone(120, 139)];
    expect(moveLimit(zones, 0, 'max', NaN, 1)[1].min).toBe(120);
  });

  it('adds a zone inside the last one, without a gap', () => {
    const added = { key: 9, name: 'Zone 2', color: '#000' };
    expect(bounds(splitLastZone([zone(100, 200)], 1, added)!)).toEqual([
      [100, 150],
      [151, 200],
    ]);
    const paces = splitLastZone([zone(6, 7), zone(5, 5.9)], 1 / 60, added)!;
    expect(paces[1].min).toBe(5.45);
    expect(paces[2].max).toBeCloseTo(5.4333, 3);
    expect(paces[2].min).toBe(5);
  });

  it('refuses to split a zone too narrow for two', () => {
    const added = { key: 9, name: 'Zone 2', color: '#000' };
    expect(splitLastZone([zone(100, 100)], 1, added)).toBeNull();
  });

  it('gives the range of a removed zone to its neighbour', () => {
    const zones = [zone(100, 119), zone(120, 139), zone(140, 200)];
    expect(bounds(removeZone(zones, 1))).toEqual([
      [100, 139],
      [140, 200],
    ]);
    expect(bounds(removeZone(zones, 0))).toEqual([
      [100, 139],
      [140, 200],
    ]);
    expect(bounds(removeZone(zones, 2))).toEqual([
      [100, 119],
      [120, 200],
    ]);
  });

  it('numbers zones after the last one', () => {
    expect(nextZoneName([zone(0, 1, 'Zone 5')], 'Zone')).toBe('Zone 6');
    expect(nextZoneName([zone(0, 1, 'Easy')], 'Zone')).toBe('Zone 2');
  });
});

describe('sets of zones', () => {
  const profile = (key: number, sports: SPORT_TYPE[]): ZoneProfile => ({
    key,
    sports,
    zones: [],
    mode: 'absolute',
  });
  const saved = (id: number, index: number, sports: string[]) =>
    ({
      trainingZoneId: id,
      index,
      name: `Zone ${index}`,
      description: '',
      color: '#000',
      values: [{ min: index, max: index, sports }],
    }) as never;
  let key = 0;

  it('groups zones by their sports, the widest first', () => {
    const groups = groupZoneProfiles(
      [saved(1, 2, [CYCLING]), saved(2, 0, []), saved(3, 1, [CYCLING])],
      () => ++key,
    );
    expect(groups.map(({ sports }) => sports)).toEqual([ALL_SPORTS, [CYCLING]]);
    expect(groups[1].zones.map(({ id }) => id)).toEqual([3, 1]);
  });

  it('never leaves a sport in two sets', () => {
    const profiles = [profile(1, ALL_SPORTS), profile(2, [])];
    const [general, cycling] = assignSports(profiles, 2, [CYCLING], true);
    expect(cycling.sports).toEqual([CYCLING]);
    expect(general.sports).not.toContain(CYCLING);
    expect(general.sports).toHaveLength(ALL_SPORTS.length - 1);
  });

  it('gives a sport back when it leaves a set', () => {
    const profiles = assignSports(
      [profile(1, ALL_SPORTS), profile(2, [])],
      2,
      [CYCLING, RUNNING],
      true,
    );
    const [general] = assignSports(profiles, 2, [CYCLING], true);
    expect(general.sports).toContain(RUNNING);
    expect(general.sports).not.toContain(CYCLING);
  });

  it('hands the sports of a removed set to the general one', () => {
    const profiles = assignSports(
      [profile(1, ALL_SPORTS), profile(2, []), profile(3, [])],
      2,
      [CYCLING],
      true,
    );
    const withRunning = assignSports(profiles, 3, [RUNNING], true);
    const left = dropProfile(withRunning, 2, true);
    expect(left).toHaveLength(2);
    expect(left[0].sports).toContain(CYCLING);
    expect(left[1].sports).toEqual([RUNNING]);
    expect(left[0].sports).not.toContain(RUNNING);
  });

  it('does not widen sets that never covered every sport', () => {
    const left = dropProfile(
      [profile(1, [RUNNING]), profile(2, [CYCLING])],
      2,
      false,
    );
    expect(left[0].sports).toEqual([RUNNING, CYCLING]);
  });
});
