import { SportType, TrainingZoneType } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/**
 * A ZONE target stores the id of one of the session athlete's training
 * zones. Ids are per athlete: a coach's own zone, or another athlete's, means
 * nothing to the athlete who does the session (their apps show the raw id,
 * their watch gets no target). Every save of a workout on an athlete's
 * session goes through `remapZonesForAthlete`, which translates such ids
 * rather than rejecting the save.
 */

type ZoneTargetLike = {
  targetType: string;
  targetValue?: number | null;
  targetMin?: number | null;
  targetMax?: number | null;
};

/** The step shapes in use: DTOs, Prisma rows, with or without repeats */
export type StepWithZoneTargets = {
  targets?: ZoneTargetLike[] | null;
  childSteps?: StepWithZoneTargets[] | null;
  repeatBlock?: { childSteps?: StepWithZoneTargets[] | null } | null;
};

export type ZoneForMatching = {
  trainingZoneId: number;
  athleteId: number;
  type: TrainingZoneType | `${TrainingZoneType}`;
  index: number;
  values: { sports: (SportType | `${SportType}`)[] }[];
};

type ZoneClient = Pick<PrismaService, 'trainingZone'>;

const isZoneTarget = (target: ZoneTargetLike) =>
  target.targetType === 'ZONE' &&
  target.targetValue !== null &&
  target.targetValue !== undefined;

function childrenOf(step: StepWithZoneTargets): StepWithZoneTargets[] {
  return [...(step.repeatBlock?.childSteps ?? []), ...(step.childSteps ?? [])];
}

/** Every zone id the workout's targets point to, repeats included */
export function zoneTargetIds(steps: StepWithZoneTargets[]): number[] {
  const ids = new Set<number>();
  const visit = (step: StepWithZoneTargets) => {
    for (const target of step.targets ?? [])
      if (isZoneTarget(target)) ids.add(target.targetValue!);
    childrenOf(step).forEach(visit);
  };
  steps.forEach(visit);
  return [...ids];
}

/** A copy of the steps with each target replaced by `map`'s targets */
function mapTargets<S extends StepWithZoneTargets>(
  steps: S[],
  map: (target: ZoneTargetLike) => ZoneTargetLike[],
): S[] {
  const mapStep = <T extends StepWithZoneTargets>(step: T): T => {
    const copy: T = { ...step };
    if (step.targets) copy.targets = step.targets.flatMap(map);
    if (step.childSteps) copy.childSteps = step.childSteps.map(mapStep);
    if (step.repeatBlock?.childSteps) {
      copy.repeatBlock = {
        ...step.repeatBlock,
        childSteps: step.repeatBlock.childSteps.map(mapStep),
      };
    }
    return copy;
  };
  return steps.map(mapStep);
}

/**
 * A ZONE target names one zone, in `targetValue`: the picker, the badges and
 * the watch exports read nothing else. AI-generated sessions could hold a
 * range of zone ids in `targetMin`/`targetMax` instead ("zones 2 to 3"),
 * which showed as two raw ids and escaped the remapping. Such a target keeps
 * its lower zone.
 */
export function singleZoneTargets<S extends StepWithZoneTargets>(
  steps: S[],
): S[] {
  return mapTargets(steps, (target) =>
    target.targetType === 'ZONE' &&
    (target.targetValue === null || target.targetValue === undefined) &&
    target.targetMin !== null &&
    target.targetMin !== undefined
      ? [
          {
            ...target,
            targetValue: target.targetMin,
            targetMin: null,
            targetMax: null,
          },
        ]
      : [target],
  );
}

/**
 * A copy of the steps with each zone id replaced through `mapping`. A target
 * whose zone has no equivalent (null) is dropped: the step stays, open.
 */
export function remapZoneTargets<S extends StepWithZoneTargets>(
  steps: S[],
  mapping: Map<number, number | null>,
): S[] {
  return mapTargets(steps, (target) => {
    if (!isZoneTarget(target) || !mapping.has(target.targetValue!))
      return [target];
    const zoneId = mapping.get(target.targetValue!);
    return zoneId === null || zoneId === undefined
      ? []
      : [{ ...target, targetValue: zoneId }];
  });
}

/** Whether a zone has bounds for the sport (an empty list means every sport) */
function appliesTo(zone: ZoneForMatching, sport: string | null | undefined) {
  if (!sport) return true;
  return zone.values.some((value) => {
    // Rows written by hand or old migrations may hold NULL
    const sports: string[] = value.sports ?? [];
    return sports.length === 0 || sports.includes(sport);
  });
}

/**
 * An athlete's zones of a type for a sport, in their order. Zones of one type
 * may be split by sport (running heart rate zones, then cycling ones), so the
 * position only means something among the zones of the session's sport. A
 * zone outside that sport falls back to its rank among all zones of its type.
 */
function rankedZones(
  zones: ZoneForMatching[],
  athleteId: number,
  type: string,
  sport: string | null | undefined,
) {
  const ofType = zones
    .filter((zone) => zone.athleteId === athleteId && zone.type === type)
    .sort((a, b) => a.index - b.index || a.trainingZoneId - b.trainingZoneId);
  const forSport = ofType.filter((zone) => appliesTo(zone, sport));
  return { ofType, forSport };
}

/**
 * For each zone id, the target athlete's zone at the same position: same
 * type, same sport, same rank. The athlete's own zones map to themselves;
 * unknown ids and zones without an equivalent map to null.
 *
 * `zones` holds the referenced zones, every zone of their owners, and every
 * zone of the target athlete.
 */
export function equivalentZones(
  zoneIds: number[],
  zones: ZoneForMatching[],
  targetAthleteId: number,
  sport: string | null | undefined,
): Map<number, number | null> {
  const byId = new Map(zones.map((zone) => [zone.trainingZoneId, zone]));
  const mapping = new Map<number, number | null>();
  for (const zoneId of zoneIds) {
    const source = byId.get(zoneId);
    if (!source) {
      mapping.set(zoneId, null);
      continue;
    }
    if (source.athleteId === targetAthleteId) {
      mapping.set(zoneId, zoneId);
      continue;
    }
    const from = rankedZones(zones, source.athleteId, source.type, sport);
    const to = rankedZones(zones, targetAthleteId, source.type, sport);
    const sportRank = from.forSport.indexOf(source);
    const match =
      sportRank >= 0
        ? to.forSport[sportRank]
        : to.ofType[from.ofType.indexOf(source)];
    mapping.set(zoneId, match?.trainingZoneId ?? null);
  }
  return mapping;
}

/** Zone ids can only be positive integers; anything else is no zone */
const isZoneId = (id: number) => Number.isInteger(id) && id > 0;

/**
 * The steps with their zone targets pointing to the athlete's equivalent
 * zones, one zone each: copies (templates, duplicates), AI plans, and
 * leftovers sent back on edit. Zones without an equivalent, default zones (negative ids) and unknown
 * ids are dropped; the step stays, open.
 */
export async function remapZonesForAthlete<S extends StepWithZoneTargets>(
  prisma: ZoneClient,
  athleteId: number,
  sport: string | null | undefined,
  workoutSteps: S[],
): Promise<S[]> {
  const steps = singleZoneTargets(workoutSteps);
  const ids = zoneTargetIds(steps);
  if (!ids.length) return steps;
  const valid = ids.filter(isZoneId);
  const select = {
    trainingZoneId: true,
    athleteId: true,
    type: true,
    index: true,
    values: { select: { sports: true } },
  } as const;
  const referenced = valid.length
    ? await prisma.trainingZone.findMany({
        where: { trainingZoneId: { in: valid } },
        select,
      })
    : [];
  const owners = [
    ...new Set([athleteId, ...referenced.map((zone) => zone.athleteId)]),
  ];
  const zones = await prisma.trainingZone.findMany({
    where: { athleteId: { in: owners } },
    select,
  });
  return remapZoneTargets(steps, equivalentZones(ids, zones, athleteId, sport));
}
