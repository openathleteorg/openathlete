import { MetricType } from '@openathlete/database';

import type { PrismaService } from '../../prisma/services/prisma.service';

const PROFILE_TYPES: string[] = [MetricType.HR_MAX, MetricType.HR_REST];

/** Whether the athlete has both an HR max and a resting HR */
export async function hasHeartRateProfile(
  prisma: Pick<PrismaService, 'athleteMetric'>,
  athleteId: number,
): Promise<boolean> {
  const types = await prisma.athleteMetric.findMany({
    where: { athleteId, type: { in: [MetricType.HR_MAX, MetricType.HR_REST] } },
    distinct: ['type'],
    select: { type: true },
  });
  return types.length === PROFILE_TYPES.length;
}

/**
 * Saves metrics a provider sent, and says whether they gave the athlete an
 * HR max and a resting HR for the first time: TRIMP needs both, so the loads
 * are then computed again. A resting HR synced every night after that changes
 * nothing worth a run over every activity.
 */
export async function savingCompletesHeartRateProfile(
  prisma: Pick<PrismaService, 'athleteMetric'>,
  athleteId: number,
  types: string[],
  save: () => Promise<unknown>,
): Promise<boolean> {
  if (!types.some((type) => PROFILE_TYPES.includes(type))) {
    await save();
    return false;
  }
  const before = await hasHeartRateProfile(prisma, athleteId);
  await save();
  return !before && (await hasHeartRateProfile(prisma, athleteId));
}
