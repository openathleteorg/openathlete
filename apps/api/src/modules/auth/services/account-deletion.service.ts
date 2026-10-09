import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { StripeService } from 'src/modules/subscription/services/stripe.service';

type Tx = Prisma.TransactionClient;

const ENDED_SUBSCRIPTION_STATUSES = new Set(['canceled', 'incomplete_expired']);

/**
 * Permanently deletes a user and everything they own (GDPR erasure).
 *
 * Most foreign keys restrict deletion, so rows are removed children first,
 * in one transaction: either the whole account goes or nothing does. The
 * account deletion integration test fails when the schema gains a foreign
 * key that this service does not handle.
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async deleteAccount(userId: number): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { userId },
      select: {
        athlete: { select: { athleteId: true } },
        subscription: {
          select: { stripeSubscriptionId: true, status: true },
        },
      },
    });

    // Stop billing first: if Stripe fails, the account is kept so the
    // deletion can be retried instead of leaving a paying ghost customer
    const subscription = user.subscription;
    if (
      subscription?.stripeSubscriptionId &&
      !ENDED_SUBSCRIPTION_STATUSES.has(subscription.status)
    ) {
      await this.stripeService.cancelSubscriptionNow(
        subscription.stripeSubscriptionId,
      );
    }

    const athleteId = user.athlete?.athleteId;
    await this.prisma.$transaction(
      async (tx) => {
        const templateEvents = await tx.eventTemplate.findMany({
          where: { userId },
          select: { eventId: true },
        });
        const athleteEvents = athleteId
          ? await tx.event.findMany({
              where: { athleteId },
              select: { eventId: true },
            })
          : [];

        // Templates are standalone copies of events, owned through the
        // template rather than an athlete
        await this.deleteEvents(tx, [
          ...athleteEvents.map((event) => event.eventId),
          ...templateEvents.map((template) => template.eventId),
        ]);

        if (athleteId) {
          await this.deleteAthleteData(tx, athleteId);
        }
        await this.deleteUserData(tx, userId);

        if (athleteId) {
          await tx.athlete.delete({ where: { athleteId } });
        }
        // Messages, read receipts and thread memberships cascade, and so do
        // the accesses given to AI agents (MCP) with their tokens and codes
        await tx.user.delete({ where: { userId } });

        await tx.messageThread.deleteMany({
          where: { participants: { none: {} } },
        });
      },
      { timeout: 60_000 },
    );

    this.logger.log(`Account deleted for user ${userId}`);
  }

  private async deleteEvents(tx: Tx, eventIds: number[]) {
    if (eventIds.length === 0) return;
    const inEvents = { eventId: { in: eventIds } };

    const activities = await tx.eventActivity.findMany({
      where: inEvents,
      select: { eventActivityId: true },
    });
    const inActivities = {
      eventActivityId: {
        in: activities.map((activity) => activity.eventActivityId),
      },
    };

    await tx.eventTemplate.deleteMany({ where: inEvents });
    // Coaches' notices copy the activity name and RPE: the foreign key only
    // clears event_id, which would leave those copies behind
    await tx.activityChatNotice.deleteMany({ where: inEvents });

    await tx.activityFeedbackQuestion.deleteMany({ where: inActivities });
    await tx.activityFeedbackEmbedding.deleteMany({ where: inActivities });
    await tx.eventActivityWeather.deleteMany({ where: inActivities });
    await tx.eventActivityNormalizationFactor.deleteMany({
      where: { normalization: inActivities },
    });
    await tx.eventActivityNormalization.deleteMany({ where: inActivities });
    // Segments, training load entries and activity threads cascade
    await tx.eventActivity.deleteMany({ where: inEvents });

    // Workouts (steps, repeats, targets) cascade from their training
    await tx.providerWorkoutExport.deleteMany({
      where: { workout: { eventTraining: inEvents } },
    });
    await tx.eventTraining.deleteMany({ where: inEvents });
    await tx.eventCompetition.deleteMany({ where: inEvents });
    await tx.eventNote.deleteMany({ where: inEvents });

    await tx.event.deleteMany({ where: { eventId: { in: eventIds } } });
  }

  private async deleteAthleteData(tx: Tx, athleteId: number) {
    const ofAthlete = { athleteId };

    await tx.trainingZoneValue.deleteMany({
      where: { trainingZone: ofAthlete },
    });
    await tx.trainingZone.deleteMany({ where: ofAthlete });
    await tx.record.deleteMany({ where: ofAthlete });
    await tx.equipment.deleteMany({ where: ofAthlete });
    await tx.providerWorkoutExport.deleteMany({ where: ofAthlete });
    await tx.providerAccount.deleteMany({ where: ofAthlete });
    await tx.athleteSettings.deleteMany({ where: ofAthlete });
    await tx.athleteInjury.deleteMany({ where: ofAthlete });
    await tx.coachAthlete.deleteMany({ where: ofAthlete });
    // Training weeks cascade from cycles; cycles only lose the athlete
    await tx.cycle.deleteMany({ where: ofAthlete });
    // Metrics, availability, training plans and load calculations cascade
  }

  private async deleteUserData(tx: Tx, userId: number) {
    await tx.eventTemplateFolder.deleteMany({ where: { userId } });
    await tx.token.deleteMany({ where: { userId } });
    await tx.subscription.deleteMany({ where: { userId } });
    // Agent messages and their blocks cascade
    await tx.agentThread.deleteMany({ where: { userId } });
    await tx.athleteInvitation.deleteMany({ where: { userId } });
    await tx.coachInvitation.deleteMany({
      where: { OR: [{ athleteUserId: userId }, { coachUserId: userId }] },
    });
    await tx.coachAthlete.deleteMany({ where: { userId } });
  }
}
