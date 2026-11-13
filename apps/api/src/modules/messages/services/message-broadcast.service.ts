import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

import { BroadcastMode, ScheduledMessageStatus } from '@openathlete/database';
import {
  SCHEDULE_MAX_DAYS,
  ScheduledMessageDto,
  SendBroadcastDto,
  SendBroadcastResultDto,
  UpdateScheduledMessageDto,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { MessageThreadService } from './message-thread.service';

/** Sooner than this, "scheduled" means now: the clock of the device may lag */
const NOW_TOLERANCE_MS = 60_000;
const DAY_MS = 24 * 3600 * 1000;
/** Messages sent per run of the scheduler; the next run takes the rest */
const DUE_BATCH = 50;

/** Tells the open apps which conversations got a message */
export const BROADCAST_DELIVERED = 'messages.broadcast.delivered';
export type BroadcastDeliveredPayload = {
  messageThreadIds: number[];
  userIds: number[];
};

/**
 * Writes one message to several people: athletes the sender coaches, or
 * their coaches. Each gets it in their private conversation with the
 * sender by default, so answers stay private; a group conversation, where
 * everyone sees the others' names, is a choice. A message can wait for a
 * date: the scheduler sends it then, to those still coached by then.
 */
@Injectable()
export class MessageBroadcastService {
  private readonly logger = new Logger(MessageBroadcastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly threads: MessageThreadService,
    @Optional() private readonly emitter?: EventEmitter2,
  ) {}

  /** The users among `userIds` linked to the sender by coaching */
  private async linked(senderId: number, userIds: number[]) {
    const others = [...new Set(userIds)].filter((id) => id !== senderId);
    if (others.length === 0) return [];
    const links = await this.prisma.coachAthlete.findMany({
      where: {
        OR: [
          { userId: senderId, athlete: { userId: { in: others } } },
          { userId: { in: others }, athlete: { userId: senderId } },
        ],
      },
      select: { userId: true, athlete: { select: { userId: true } } },
    });
    const reachable = new Set(
      links.flatMap((link) => [link.userId, link.athlete.userId]),
    );
    return others.filter((id) => reachable.has(id));
  }

  async send(
    user: AuthUser,
    dto: SendBroadcastDto,
  ): Promise<SendBroadcastResultDto> {
    const recipients = await this.linked(user.userId, dto.recipientUserIds);
    const asked = new Set(
      dto.recipientUserIds.filter((id) => id !== user.userId),
    );
    if (recipients.length === 0 || recipients.length !== asked.size) {
      throw new ForbiddenException(
        'You can only write to your coaches and athletes',
      );
    }

    const now = Date.now();
    if (dto.sendAt && dto.sendAt.getTime() > now + NOW_TOLERANCE_MS) {
      if (dto.sendAt.getTime() > now + SCHEDULE_MAX_DAYS * DAY_MS) {
        throw new BadRequestException('Too far ahead');
      }
      const scheduled = await this.prisma.scheduledMessage.create({
        data: {
          senderId: user.userId,
          content: dto.content,
          mode: dto.mode,
          title: dto.mode === BroadcastMode.GROUP ? (dto.title ?? null) : null,
          recipientUserIds: recipients,
          sendAt: dto.sendAt,
        },
        select: { scheduledMessageId: true },
      });
      return {
        messageThreadIds: [],
        scheduledMessageId: scheduled.scheduledMessageId,
      };
    }

    const messageThreadIds = await this.deliver(
      user.userId,
      recipients,
      dto.content,
      dto.mode,
      dto.title,
    );
    return { messageThreadIds, scheduledMessageId: null };
  }

  /** The private conversation of two people, outside any activity */
  private async pairThread(senderId: number, recipientId: number) {
    const existing = await this.prisma.messageThread.findFirst({
      where: {
        eventActivityId: null,
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: recipientId } } },
          {
            participants: {
              every: { userId: { in: [senderId, recipientId] } },
            },
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: { messageThreadId: true },
    });
    if (existing) return existing.messageThreadId;
    const created = await this.threads.createThread(
      { userId: senderId } as AuthUser,
      { participantUserIds: [senderId, recipientId] },
    );
    return created.messageThreadId;
  }

  /** Writes the message now; the recipients were checked by the caller */
  private async deliver(
    senderId: number,
    recipients: number[],
    content: string,
    mode: BroadcastMode,
    title?: string | null,
  ): Promise<number[]> {
    const threadIds: number[] = [];
    if (mode === BroadcastMode.GROUP) {
      const thread = await this.threads.createThread(
        { userId: senderId } as AuthUser,
        {
          participantUserIds: [senderId, ...recipients],
          ...(title && { title }),
        },
      );
      threadIds.push(thread.messageThreadId);
    } else {
      for (const recipient of recipients) {
        threadIds.push(await this.pairThread(senderId, recipient));
      }
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.message.createMany({
        data: threadIds.map((messageThreadId) => ({
          messageThreadId,
          senderId,
          content,
        })),
      }),
      this.prisma.messageThread.updateMany({
        where: { messageThreadId: { in: threadIds } },
        data: { updatedAt: now },
      }),
    ]);

    this.emitter?.emit(BROADCAST_DELIVERED, {
      messageThreadIds: threadIds,
      userIds: [senderId, ...recipients],
    } satisfies BroadcastDeliveredPayload);
    return threadIds;
  }

  async listScheduled(user: AuthUser): Promise<ScheduledMessageDto[]> {
    const pending = await this.prisma.scheduledMessage.findMany({
      where: { senderId: user.userId, status: ScheduledMessageStatus.PENDING },
      orderBy: { sendAt: 'asc' },
    });
    const people = await this.prisma.user.findMany({
      where: { userId: { in: pending.flatMap((m) => m.recipientUserIds) } },
      select: { userId: true, firstName: true, lastName: true },
    });
    const byId = new Map(people.map((person) => [person.userId, person]));
    return pending.map((message) => ({
      scheduledMessageId: message.scheduledMessageId,
      content: message.content,
      mode: message.mode,
      title: message.title,
      sendAt: message.sendAt,
      // Someone gone since is left out, as they will be when it is sent
      recipients: message.recipientUserIds
        .map((id) => byId.get(id))
        .filter((person) => person !== undefined),
    }));
  }

  private async requirePending(user: AuthUser, scheduledMessageId: number) {
    const message = await this.prisma.scheduledMessage.findFirst({
      where: {
        scheduledMessageId,
        senderId: user.userId,
        status: ScheduledMessageStatus.PENDING,
      },
      select: { scheduledMessageId: true },
    });
    if (!message) throw new NotFoundException('Scheduled message not found');
  }

  async updateScheduled(
    user: AuthUser,
    scheduledMessageId: number,
    dto: UpdateScheduledMessageDto,
  ): Promise<void> {
    await this.requirePending(user, scheduledMessageId);
    if (dto.sendAt) {
      const now = Date.now();
      if (dto.sendAt.getTime() <= now) {
        throw new BadRequestException('The date has passed');
      }
      if (dto.sendAt.getTime() > now + SCHEDULE_MAX_DAYS * DAY_MS) {
        throw new BadRequestException('Too far ahead');
      }
    }
    // Conditional on the status: the scheduler may have claimed it since
    const { count } = await this.prisma.scheduledMessage.updateMany({
      where: { scheduledMessageId, status: ScheduledMessageStatus.PENDING },
      data: {
        ...(dto.content && { content: dto.content }),
        ...(dto.sendAt && { sendAt: dto.sendAt }),
      },
    });
    if (count === 0) throw new NotFoundException('Scheduled message not found');
  }

  async cancelScheduled(
    user: AuthUser,
    scheduledMessageId: number,
  ): Promise<void> {
    await this.requirePending(user, scheduledMessageId);
    const { count } = await this.prisma.scheduledMessage.updateMany({
      where: { scheduledMessageId, status: ScheduledMessageStatus.PENDING },
      data: { status: ScheduledMessageStatus.CANCELED },
    });
    if (count === 0) throw new NotFoundException('Scheduled message not found');
  }

  /**
   * Sends the messages whose time has come. Every API instance runs it: a
   * message is claimed (PENDING to SENDING) before it is sent, so only one
   * of them sends it.
   */
  @Cron('* * * * *')
  async sendDue(now = new Date()): Promise<number> {
    const due = await this.prisma.scheduledMessage.findMany({
      where: { status: ScheduledMessageStatus.PENDING, sendAt: { lte: now } },
      orderBy: { sendAt: 'asc' },
      take: DUE_BATCH,
    });
    let sent = 0;
    for (const message of due) {
      const { count } = await this.prisma.scheduledMessage.updateMany({
        where: {
          scheduledMessageId: message.scheduledMessageId,
          status: ScheduledMessageStatus.PENDING,
        },
        data: { status: ScheduledMessageStatus.SENDING },
      });
      if (count === 0) continue;
      try {
        const recipients = await this.linked(
          message.senderId,
          message.recipientUserIds,
        );
        if (recipients.length > 0) {
          await this.deliver(
            message.senderId,
            recipients,
            message.content,
            message.mode,
            message.title,
          );
        }
        await this.prisma.scheduledMessage.update({
          where: { scheduledMessageId: message.scheduledMessageId },
          data: { status: ScheduledMessageStatus.SENT, sentAt: new Date() },
        });
        sent++;
      } catch (error) {
        this.logger.error(
          `Scheduled message ${message.scheduledMessageId} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        await this.prisma.scheduledMessage.update({
          where: { scheduledMessageId: message.scheduledMessageId },
          data: { status: ScheduledMessageStatus.FAILED },
        });
      }
    }
    return sent;
  }
}
