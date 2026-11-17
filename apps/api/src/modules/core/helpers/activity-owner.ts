import { ConnectorProvider } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/**
 * The activity the provider sends, already saved for another of our athletes
 * by an earlier connection of the same provider user: a second account, or
 * an account they connected first and left. That connection is no longer
 * active, otherwise both accounts would keep taking it from each other.
 */
export async function activityToTakeOver(
  prisma: PrismaService,
  account: {
    athleteId: number;
    provider: ConnectorProvider;
    externalUserId: string | null;
  },
  externalId: string,
): Promise<number | null> {
  if (!account.externalUserId) return null;
  const known = await prisma.eventActivity.findUnique({
    where: { externalId },
    select: {
      eventActivityId: true,
      provider: true,
      event: { select: { athleteId: true } },
    },
  });
  const owner = known?.event.athleteId;
  if (!known || known.provider !== account.provider) return null;
  if (owner == null || owner === account.athleteId) return null;
  const previous = await prisma.providerAccount.findFirst({
    where: {
      athleteId: owner,
      provider: account.provider,
      externalUserId: account.externalUserId,
      status: { not: 'active' },
    },
    select: { providerAccountId: true },
  });
  return previous ? known.eventActivityId : null;
}

/**
 * Gives the activity to another athlete. What belonged to the previous one
 * (their gear, planned session, training week, injury) is unlinked; what is
 * computed for an athlete (records, training load) is removed, for the
 * processing that follows the import to compute it again for the new one.
 */
export async function moveActivityToAthlete(
  prisma: PrismaService,
  eventActivityId: number,
  athleteId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const activity = await tx.eventActivity.update({
      where: { eventActivityId },
      data: { equipmentId: null },
      select: { eventId: true },
    });
    await tx.event.update({
      where: { eventId: activity.eventId },
      data: { athleteId, trainingWeekId: null },
    });
    await tx.eventTraining.updateMany({
      where: { relatedActivityId: eventActivityId },
      data: { relatedActivityId: null },
    });
    await tx.eventCompetition.updateMany({
      where: { relatedActivityId: eventActivityId },
      data: { relatedActivityId: null },
    });
    await tx.athleteInjury.updateMany({
      where: { sourceActivityId: eventActivityId },
      data: { sourceActivityId: null },
    });
    await tx.garminPersonalItem.updateMany({
      where: { eventActivityId, connection: { athleteId: { not: athleteId } } },
      data: { eventActivityId: null },
    });
    await tx.activityChatNotice.updateMany({
      where: { eventId: activity.eventId },
      data: { eventId: null },
    });
    await tx.record.deleteMany({ where: { eventActivityId } });
    await tx.trainingLoadEntry.deleteMany({
      where: { activityId: eventActivityId },
    });
  });
}
