import {
  SPORT_TYPE,
  TrainingZone,
  TrainingZoneValue,
} from '@openathlete/shared';

import { ALL_SPORTS } from './sport-summary';

export type ZoneMode = 'absolute' | 'max' | 'reserve';

export interface ZoneDraft {
  /** Stable while editing, including for zones not saved yet */
  key: number;
  id?: number;
  name: string;
  description: string;
  min: number;
  max: number;
  color: string;
}

/** One set of zones and the sports it applies to. */
export interface ZoneProfile {
  key: number;
  sports: SPORT_TYPE[];
  zones: ZoneDraft[];
  mode: ZoneMode;
}

type SavedZone = TrainingZone & { values: TrainingZoneValue[] };

const PACE_SECOND = 1 / 60;

/** Pace is stored in decimal minutes, which nobody reads: 5.9 is 5:54. */
export const paceStep = PACE_SECOND;

const roundPace = (value: number) => Math.round(value * 10000) / 10000;

export function formatPace(minutes: number): string {
  if (!Number.isFinite(minutes)) return '';
  const seconds = Math.round(minutes * 60);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function parsePace(text: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(text.trim());
  if (!match) return null;
  return roundPace(Number(match[1]) + Number(match[2]) / 60);
}

/**
 * Zones share their storage: each row has one range and its sports. Rows with
 * the same sports are one set, the widest first as it covers the other sports.
 */
export function groupZoneProfiles(
  zones: SavedZone[],
  nextKey: () => number,
): ZoneProfile[] {
  const groups = new Map<string, ZoneProfile>();
  for (const zone of [...zones].sort((a, b) => a.index - b.index)) {
    const value = zone.values[0];
    const sports = (
      value?.sports.length ? value.sports : ALL_SPORTS
    ) as SPORT_TYPE[];
    const id = [...sports].sort().join();
    const group = groups.get(id) ?? {
      key: nextKey(),
      sports,
      zones: [],
      mode: 'absolute' as const,
    };
    groups.set(id, group);
    group.zones.push({
      key: nextKey(),
      id: zone.trainingZoneId,
      name: zone.name,
      description: zone.description,
      min: value?.min ?? 0,
      max: value?.max ?? 0,
      color: zone.color,
    });
  }
  return [...groups.values()].sort((a, b) => b.sports.length - a.sports.length);
}

/** Whether the first set takes every sport the others leave. */
export function coversRemainingSports(profiles: ZoneProfile[]): boolean {
  const covered = new Set(profiles.flatMap((profile) => profile.sports));
  return ALL_SPORTS.every((sport) => covered.has(sport));
}

/**
 * Gives sports to a set. A sport has a single set of zones: time in zones would
 * count twice otherwise, so the others let go of it.
 */
export function assignSports(
  profiles: ZoneProfile[],
  key: number,
  sports: SPORT_TYPE[],
  coversRest: boolean,
): ZoneProfile[] {
  const [first, ...others] = profiles.map((profile) =>
    profile.key === key
      ? { ...profile, sports }
      : {
          ...profile,
          sports: profile.sports.filter((sport) => !sports.includes(sport)),
        },
  );
  const taken = new Set(others.flatMap((profile) => profile.sports));
  return [
    coversRest
      ? { ...first, sports: ALL_SPORTS.filter((sport) => !taken.has(sport)) }
      : first,
    ...others,
  ];
}

/** Removes a set; its sports go back to the general one. */
export function dropProfile(
  profiles: ZoneProfile[],
  key: number,
  coversRest: boolean,
): ZoneProfile[] {
  const dropped = profiles.find((profile) => profile.key === key);
  const [first, ...others] = profiles.filter((profile) => profile.key !== key);
  const taken = new Set(others.flatMap((profile) => profile.sports));
  return [
    {
      ...first,
      sports: coversRest
        ? ALL_SPORTS.filter((sport) => !taken.has(sport))
        : [...new Set([...first.sports, ...(dropped?.sports ?? [])])],
    },
    ...others,
  ];
}

/** Paces go from slow to fast, so their limits go down from zone to zone. */
export function isDescending(zones: ZoneDraft[]): boolean {
  return zones.length > 1 && zones[0].min > zones[1].min;
}

/** Moves a limit; the neighbouring zone starts where this one ends. */
export function moveLimit(
  zones: ZoneDraft[],
  index: number,
  field: 'min' | 'max',
  value: number,
  step: number,
): ZoneDraft[] {
  const next = zones.map((zone) => ({ ...zone }));
  next[index][field] = value;
  if (!Number.isFinite(value)) return next;
  const descending = isDescending(zones);
  const neighbour = next[index + 1];
  if (neighbour && field === 'max' && !descending) {
    neighbour.min = roundPace(value + step);
  }
  if (neighbour && field === 'min' && descending) {
    neighbour.max = roundPace(value - step);
  }
  return next;
}

/** Cuts the last zone in two, so a new zone never leaves a gap. */
export function splitLastZone(
  zones: ZoneDraft[],
  step: number,
  added: Pick<ZoneDraft, 'key' | 'name' | 'color'>,
): ZoneDraft[] | null {
  const last = zones[zones.length - 1];
  const descending = isDescending(zones);
  const middle =
    step >= 1
      ? Math.round((last.min + last.max) / 2)
      : roundPace((last.min + last.max) / 2);
  if (middle + step > last.max || middle - step < last.min) return null;
  const blank = { ...added, description: '' };
  return [
    ...zones.slice(0, -1),
    descending ? { ...last, min: middle } : { ...last, max: middle },
    descending
      ? { ...blank, min: last.min, max: roundPace(middle - step) }
      : { ...blank, min: roundPace(middle + step), max: last.max },
  ];
}

/** The range of a removed zone goes to its neighbour. */
export function removeZone(zones: ZoneDraft[], index: number): ZoneDraft[] {
  const removed = zones[index];
  const descending = isDescending(zones);
  return zones
    .map((zone, i) => {
      if (i === index - 1) {
        return descending
          ? { ...zone, min: removed.min }
          : { ...zone, max: removed.max };
      }
      if (index === 0 && i === 1) {
        return descending
          ? { ...zone, max: removed.max }
          : { ...zone, min: removed.min };
      }
      return zone;
    })
    .filter((_, i) => i !== index);
}

/** "Zone 3" comes after "Zone 2", zones counted from 0 or 1 alike. */
export function nextZoneName(zones: ZoneDraft[], word: string): string {
  const number = /(\d+)\s*$/.exec(zones[zones.length - 1]?.name ?? '');
  return `${word} ${number ? Number(number[1]) + 1 : zones.length + 1}`;
}
