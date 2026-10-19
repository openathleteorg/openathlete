import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { Prisma } from '@openathlete/database';
import {
  CoachActivityAlertSettingsDto,
  defaultCoachActivityAlertSettings,
} from '@openathlete/shared';

import {
  CoachActivityNoticeEvent,
  CoachActivityNoticeKind,
} from '../../../events/coach-activity-notice.event';
import { AuthUser } from '../../auth/decorators/user.decorator';
import { PrismaService, PrismaTx } from '../../prisma/services/prisma.service';

export const ACTIVITY_NOTICE_SELECT = {
  kind: true,
  eventId: true,
  eventName: true,
  rpe: true,
} satisfies Prisma.ActivityChatNoticeSelect;
const MESSAGE_INCLUDE = {
  activityNotice: { select: ACTIVITY_NOTICE_SELECT },
  sender: {
    select: { userId: true, firstName: true, lastName: true },
  },
  readReceipts: true,
} satisfies Prisma.MessageInclude;
const settingsSelect = {
  notifyComments: true,
  notifyRpe: true,
  notifyNewActivities: true,
};
const labels: Record<string, Record<CoachActivityNoticeKind, string>> = {
  ES: {
    ACTIVITY: 'Nueva actividad',
    COMMENT: 'Comentario de la actividad actualizado',
    RPE: 'RPE de la actividad actualizado',
  },
  EN: {
    ACTIVITY: 'New activity',
    COMMENT: 'Activity comment updated',
    RPE: 'Activity RPE updated',
  },
  FR: {
    ACTIVITY: 'Nouvelle activité',
    COMMENT: 'Commentaire de l’activité mis à jour',
    RPE: 'RPE de l’activité mis à jour',
  },
  IT: {
    ACTIVITY: 'Nuova attività',
    COMMENT: 'Commento dell’attività aggiornato',
    RPE: 'RPE dell’attività aggiornato',
  },
};

@Injectable()
export class CoachActivityNoticeService {
  private readonly logger = new Logger(CoachActivityNoticeService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  private async authorize(
    user: AuthUser,
    athleteId: number,
    db: PrismaTx = this.prisma,
  ) {
    if (
      !(await db.coachAthlete.findFirst({
        where: {
          userId: user.userId,
          athleteId,
          user: { roles: { has: 'COACH' } },
        },
      }))
    )
      throw new ForbiddenException();
  }

  async settings(user: AuthUser, athleteId: number) {
    await this.authorize(user, athleteId);
    return (
      (await this.prisma.coachActivityAlertSettings.findUnique({
        where: {
          coachUserId_athleteId: { coachUserId: user.userId, athleteId },
        },
        select: settingsSelect,
      })) ?? defaultCoachActivityAlertSettings
    );
  }

  async updateSettings(
    user: AuthUser,
    athleteId: number,
    input: CoachActivityAlertSettingsDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.authorize(user, athleteId, tx);
      return tx.coachActivityAlertSettings.upsert({
        where: {
          coachUserId_athleteId: { coachUserId: user.userId, athleteId },
        },
        create: { coachUserId: user.userId, athleteId, ...input },
        update: input,
        select: settingsSelect,
      });
    });
  }

  @OnEvent(CoachActivityNoticeEvent.SLUG, { async: true })
  async handle(notice: CoachActivityNoticeEvent) {
    // Notification failures never roll back an athlete's feedback or import.
    try {
      await this.deliver(notice.payload);
    } catch {
      this.logger.error('Activity chat notification could not be delivered');
    }
  }

  async deliver(payload: CoachActivityNoticeEvent['payload']) {
    const event = await this.prisma.event.findUnique({
      where: { eventId: payload.eventId },
      select: {
        type: true,
        athleteId: true,
        athlete: {
          select: { userId: true, coachAthletes: { select: { userId: true } } },
        },
      },
    });
    if (event?.type !== 'ACTIVITY' || !event.athlete || !event.athleteId)
      return;
    if (
      payload.kind !== 'ACTIVITY' &&
      payload.actorUserId !== event.athlete.userId
    )
      return;
    const athleteId = event.athleteId;
    const athleteUserId = event.athlete.userId;
    for (const coachUserId of new Set(
      event.athlete.coachAthletes.map((c) => c.userId),
    )) {
      if (coachUserId === athleteUserId) continue;
      const message = await this.prisma.$transaction(async (tx) => {
        // Serialize delivery for this coach across API/worker processes.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(714205, ${coachUserId}::int)`;
        const current = await tx.event.findFirst({
          where: {
            eventId: payload.eventId,
            type: 'ACTIVITY',
            athleteId,
            athlete: {
              userId: athleteUserId,
              coachAthletes: {
                some: {
                  userId: coachUserId,
                  user: { roles: { has: 'COACH' } },
                },
              },
            },
          },
          select: {
            name: true,
            athlete: {
              select: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        });
        if (!current) return null;
        // Coaches take part in activity threads: they already got the comment
        if (
          payload.sourceThreadId &&
          (await tx.messageThreadParticipant.findFirst({
            where: {
              messageThreadId: payload.sourceThreadId,
              userId: coachUserId,
            },
          }))
        )
          return null;
        const deliveryKey = `${payload.kind}:${payload.deliveryKey}`;
        if (
          await tx.activityChatNotice.findUnique({
            where: { coachUserId_deliveryKey: { coachUserId, deliveryKey } },
          })
        )
          return null;
        const settings =
          (await tx.coachActivityAlertSettings.findUnique({
            where: { coachUserId_athleteId: { coachUserId, athleteId } },
            select: settingsSelect,
          })) ?? defaultCoachActivityAlertSettings;
        const enabled = {
          COMMENT: settings.notifyComments,
          RPE: settings.notifyRpe,
          ACTIVITY: settings.notifyNewActivities,
        }[payload.kind];
        const stored = await tx.activityChatNotice.create({
          data: {
            coachUserId,
            deliveryKey,
            kind: payload.kind,
            eventId: payload.eventId,
            eventName: current.name,
            rpe: payload.kind === 'RPE' ? (payload.rpe ?? null) : null,
          },
        });
        if (!enabled) return null; // Remember suppression so retries are not backfilled after enabling.
        const coach = await tx.user.findUniqueOrThrow({
          where: { userId: coachUserId },
          select: { language: true },
        });
        const prefix = (labels[coach.language] ?? labels.EN)[payload.kind];
        const content = `${prefix}: ${current.name}`;
        // Successive edits refresh the notice the coach has not read yet
        // instead of piling up one message per save
        if (payload.kind !== 'ACTIVITY') {
          const unread = await tx.activityChatNotice.findFirst({
            where: {
              coachUserId,
              eventId: payload.eventId,
              kind: payload.kind,
              message: {
                is: { readReceipts: { none: { userId: coachUserId } } },
              },
            },
            orderBy: { id: 'desc' },
          });
          if (unread?.messageId) {
            await tx.activityChatNotice.update({
              where: { id: unread.id },
              data: { eventName: stored.eventName, rpe: stored.rpe },
            });
            return tx.message.update({
              where: { messageId: unread.messageId },
              data: { content },
              include: MESSAGE_INCLUDE,
            });
          }
        }
        const participants = [coachUserId, athleteUserId];
        let thread = await tx.messageThread.findFirst({
          where: {
            eventActivityId: null,
            eventTraining: null,
            AND: participants.map((userId) => ({
              participants: { some: { userId } },
            })),
            participants: { every: { userId: { in: participants } } },
          },
          orderBy: { messageThreadId: 'asc' },
        });
        if (!thread)
          thread = await tx.messageThread.create({
            data: {
              title:
                `${current.athlete!.user.firstName} ${current.athlete!.user.lastName}`.trim(),
              participants: {
                create: participants.map((userId) => ({ userId })),
              },
            },
          });
        const created = await tx.message.create({
          data: {
            messageThreadId: thread.messageThreadId,
            senderId: athleteUserId,
            content,
            activityNotice: { connect: { id: stored.id } },
          },
          include: MESSAGE_INCLUDE,
        });
        await tx.messageThread.update({
          where: { messageThreadId: thread.messageThreadId },
          data: { updatedAt: created.createdAt },
        });
        return created;
      });
      if (message)
        this.emitter.emit('activity.chat.delivered', {
          message,
          userIds: [coachUserId, athleteUserId],
        });
    }
  }
}
