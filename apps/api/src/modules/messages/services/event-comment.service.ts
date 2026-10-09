import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EventCommentCount, EventComments } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { MessageService } from './message.service';

/** Where an event's comments live: its own thread, linked by type */
type Commentable = {
  eventId: number;
  athleteUserId: number;
  coachUserIds: number[];
  threadId: number | null;
  link:
    | { kind: 'training'; eventTrainingId: number }
    | { kind: 'activity'; eventActivityId: number };
};

/**
 * Comments between an athlete and their coaches on a planned session or an
 * activity, kept in the message thread of that event: they also show in the
 * Messages page, with its notifications.
 */
@Injectable()
export class EventCommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly messages: MessageService,
  ) {}

  /** The event if the user can read it, with its thread if any */
  private async commentable(
    user: AuthUser,
    eventId: number,
  ): Promise<Commentable> {
    const ability = await this.abilities.getFor({ user });
    const event = await this.prisma.event.findFirst({
      where: { AND: [{ eventId }, accessibleBy(ability, 'read').Event] },
      select: {
        eventId: true,
        athlete: {
          select: {
            userId: true,
            coachAthletes: { select: { userId: true } },
          },
        },
        training: {
          select: { eventTrainingId: true, messageThreadId: true },
        },
        activity: {
          select: {
            eventActivityId: true,
            messageThread: { select: { messageThreadId: true } },
          },
        },
      },
    });
    if (!event?.athlete) {
      throw new NotFoundException('Event not found');
    }
    const base = {
      eventId,
      athleteUserId: event.athlete.userId,
      coachUserIds: event.athlete.coachAthletes.map((coach) => coach.userId),
    };
    if (event.training) {
      return {
        ...base,
        threadId: event.training.messageThreadId,
        link: {
          kind: 'training',
          eventTrainingId: event.training.eventTrainingId,
        },
      };
    }
    if (event.activity) {
      return {
        ...base,
        threadId: event.activity.messageThread?.messageThreadId ?? null,
        link: {
          kind: 'activity',
          eventActivityId: event.activity.eventActivityId,
        },
      };
    }
    throw new BadRequestException(
      'Only planned sessions and activities take comments',
    );
  }

  async list(user: AuthUser, eventId: number): Promise<EventComments> {
    const event = await this.commentable(user, eventId);
    if (!event.threadId) return { comments: [], unread: 0 };
    const [messages, participant] = await Promise.all([
      this.prisma.message.findMany({
        where: { messageThreadId: event.threadId },
        orderBy: { createdAt: 'asc' },
        select: {
          messageId: true,
          content: true,
          createdAt: true,
          senderId: true,
          sender: { select: { userId: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.messageThreadParticipant.findFirst({
        where: { messageThreadId: event.threadId, userId: user.userId },
        select: { lastReadAt: true },
      }),
    ]);
    return {
      comments: messages.map((message) => ({
        messageId: message.messageId,
        content: message.content,
        createdAt: message.createdAt,
        sender: message.sender,
        mine: message.senderId === user.userId,
      })),
      unread: messages.filter(
        (message) =>
          message.senderId !== user.userId &&
          (!participant?.lastReadAt ||
            message.createdAt > participant.lastReadAt),
      ).length,
    };
  }

  /**
   * Adds a comment, creating the event's thread on the first one. The
   * athlete and their coaches take part, including coaches who arrived
   * after the thread was created. Returns who should hear of it.
   */
  async add(user: AuthUser, eventId: number, content: string) {
    const event = await this.commentable(user, eventId);
    const participantIds = [
      ...new Set([event.athleteUserId, ...event.coachUserIds, user.userId]),
    ];

    let threadId = event.threadId;
    if (!threadId) {
      const name = await this.prisma.event.findUniqueOrThrow({
        where: { eventId },
        select: { name: true },
      });
      const thread = await this.prisma.messageThread.create({
        data: {
          title: name.name,
          ...(event.link.kind === 'activity' && {
            eventActivityId: event.link.eventActivityId,
          }),
          participants: {
            create: participantIds.map((userId) => ({ userId })),
          },
        },
        select: { messageThreadId: true },
      });
      threadId = thread.messageThreadId;
      if (event.link.kind === 'training') {
        await this.prisma.eventTraining.update({
          where: { eventTrainingId: event.link.eventTrainingId },
          data: { messageThreadId: threadId },
        });
      }
    } else {
      await this.prisma.messageThreadParticipant.createMany({
        data: participantIds.map((userId) => ({
          messageThreadId: threadId!,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    const message = await this.messages.createMessage(user, {
      messageThreadId: threadId,
      content,
    });
    // Writing is reading: the user's own comment is never unread to them
    await this.markRead(user, eventId);
    return { message, threadId, participantIds };
  }

  async markRead(user: AuthUser, eventId: number) {
    const event = await this.commentable(user, eventId);
    if (!event.threadId) return;
    await this.prisma.messageThreadParticipant.updateMany({
      where: { messageThreadId: event.threadId, userId: user.userId },
      data: { lastReadAt: new Date() },
    });
  }

  /**
   * How many comments each event of a range has, and how many the user has
   * not read: what calendar cards show. One query for the whole range.
   */
  async counts(
    user: AuthUser,
    startDate: Date,
    endDate: Date,
    athleteId?: number,
  ): Promise<EventCommentCount[]> {
    const ability = await this.abilities.getFor({ user });
    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          accessibleBy(ability, 'read').Event,
          athleteId ? { athleteId } : { athleteId: { not: null } },
          { startDate: { gte: startDate, lte: endDate } },
          {
            OR: [
              { training: { messageThreadId: { not: null } } },
              { activity: { messageThread: { isNot: null } } },
            ],
          },
        ],
      },
      select: {
        eventId: true,
        training: { select: { messageThreadId: true } },
        activity: {
          select: { messageThread: { select: { messageThreadId: true } } },
        },
      },
    });
    const threadOf = new Map<number, number>();
    for (const event of events) {
      const threadId =
        event.training?.messageThreadId ??
        event.activity?.messageThread?.messageThreadId;
      if (threadId) threadOf.set(threadId, event.eventId);
    }
    if (!threadOf.size) return [];

    const threadIds = [...threadOf.keys()];
    const [messages, reads] = await Promise.all([
      this.prisma.message.findMany({
        where: { messageThreadId: { in: threadIds } },
        select: { messageThreadId: true, senderId: true, createdAt: true },
      }),
      this.prisma.messageThreadParticipant.findMany({
        where: { messageThreadId: { in: threadIds }, userId: user.userId },
        select: { messageThreadId: true, lastReadAt: true },
      }),
    ]);
    const readAt = new Map(
      reads.map((read) => [read.messageThreadId, read.lastReadAt]),
    );
    const counts = new Map<number, EventCommentCount>();
    for (const message of messages) {
      const eventId = threadOf.get(message.messageThreadId)!;
      const entry = counts.get(eventId) ?? { eventId, count: 0, unread: 0 };
      entry.count += 1;
      const lastRead = readAt.get(message.messageThreadId);
      if (
        message.senderId !== user.userId &&
        (!lastRead || message.createdAt > lastRead)
      ) {
        entry.unread += 1;
      }
      counts.set(eventId, entry);
    }
    return [...counts.values()];
  }
}
