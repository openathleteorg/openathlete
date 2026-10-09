/**
 * What a cycle stands for, matching Prisma CycleKind: a training block, or a
 * period the athlete cannot train.
 */
export enum CYCLE_KIND {
  TRAINING = 'TRAINING',
  TRAVEL = 'TRAVEL',
  ILLNESS = 'ILLNESS',
  INJURY = 'INJURY',
}

/** Kinds that mark a period without training */
export const UNAVAILABLE_CYCLE_KINDS = [
  CYCLE_KIND.TRAVEL,
  CYCLE_KIND.ILLNESS,
  CYCLE_KIND.INJURY,
] as const;
