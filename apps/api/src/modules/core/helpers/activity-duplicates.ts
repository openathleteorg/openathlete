import { ConnectorProvider } from '@openathlete/database';

/**
 * The same workout synced from two sources (a watch brand and Strava, or a
 * provider and a file) starts at nearly the same time and lasts about as
 * long. Sports are not compared: each provider labels them its own way.
 */
export const DUPLICATE_START_TOLERANCE_MS = 3 * 60 * 1000;
/** Largest gap between two durations, as a share of the longer one */
export const DUPLICATE_DURATION_TOLERANCE = 0.2;

/**
 * Where an activity comes from. Activities typed in by hand are left out of
 * duplicate matching: a recording of the same workout is worth keeping.
 */
export type ActivitySource = ConnectorProvider | 'FILE' | 'MANUAL';

export function activitySource(activity: {
  provider: ConnectorProvider | null;
  externalId: string;
}): ActivitySource {
  if (activity.provider) return activity.provider;
  // Logged in OpenAthlete (manual-activity.service.ts)
  if (activity.externalId.startsWith('manual-')) return 'MANUAL';
  // FIT, GPX or TCX files uploaded by the athlete
  return 'FILE';
}

export interface DuplicateCandidate {
  source: ActivitySource;
  startDate: Date;
  endDate: Date;
  /** Seconds; moving or timer time, whatever the source gives */
  movingTime?: number | null;
}

/** Elapsed and moving times, the ones known */
function durations(activity: DuplicateCandidate): number[] {
  const elapsed =
    (activity.endDate.getTime() - activity.startDate.getTime()) / 1000;
  return [elapsed, activity.movingTime ?? 0].filter(
    (seconds) => Number.isFinite(seconds) && seconds > 0,
  );
}

function closeDurations(a: number, b: number): boolean {
  return Math.abs(a - b) <= DUPLICATE_DURATION_TOLERANCE * Math.max(a, b);
}

/**
 * Whether two activities from different sources record the same workout:
 * starts within 3 minutes, and one of their durations (elapsed or moving)
 * within 20%. Sources count elapsed and moving time differently, so any of
 * the known durations may match.
 */
export function isSameWorkout(
  a: DuplicateCandidate,
  b: DuplicateCandidate,
): boolean {
  if (a.source === b.source) return false;
  if (a.source === 'MANUAL' || b.source === 'MANUAL') return false;
  const startGap = Math.abs(a.startDate.getTime() - b.startDate.getTime());
  if (!(startGap <= DUPLICATE_START_TOLERANCE_MS)) return false;
  const durationsB = durations(b);
  return durations(a).some((da) =>
    durationsB.some((db) => closeDurations(da, db)),
  );
}

export interface SavedActivity extends DuplicateCandidate {
  eventActivityId: number;
  createdAt: Date;
  /** Linked to a planned training or race */
  linkedToPlan: boolean;
  /** Has comments or answered feedback questions */
  hasConversation: boolean;
}

/**
 * Groups of activities recording the same workout, of two or more each.
 * Matches chain: a Garmin activity matching both a Strava one and a file
 * puts the three in one group.
 */
export function findDuplicateGroups<T extends SavedActivity>(
  activities: T[],
): T[][] {
  const sorted = [...activities].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );
  const parent = sorted.map((_, index) => index);
  const root = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const gap = sorted[j].startDate.getTime() - sorted[i].startDate.getTime();
      if (gap > DUPLICATE_START_TOLERANCE_MS) break;
      if (isSameWorkout(sorted[i], sorted[j])) parent[root(j)] = root(i);
    }
  }
  const groups = new Map<number, T[]>();
  sorted.forEach((activity, index) => {
    const key = root(index);
    groups.set(key, [...(groups.get(key) ?? []), activity]);
  });
  return [...groups.values()].filter((group) => group.length > 1);
}

/**
 * The copy to keep: the one the athlete or their coach worked with
 * (commented or feedback answered, then linked to a planned session), then a
 * device's recording over Strava's copy of it, then the first imported.
 * Comments go first because they cannot follow the kept copy; a link to a
 * planned session can.
 */
export function pickActivityToKeep<T extends SavedActivity>(group: T[]): T {
  const rank = (activity: T) => [
    activity.hasConversation ? 0 : 1,
    activity.linkedToPlan ? 0 : 1,
    activity.source === ConnectorProvider.STRAVA ? 1 : 0,
    activity.createdAt.getTime(),
    activity.eventActivityId,
  ];
  return [...group].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) {
      if (ra[i] !== rb[i]) return ra[i] - rb[i];
    }
    return 0;
  })[0];
}
