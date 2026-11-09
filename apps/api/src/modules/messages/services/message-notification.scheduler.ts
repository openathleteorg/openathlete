import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import type { ApiEnvSchemaType } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { maskEmail } from 'src/common/utils/mask-email';
import {
  buildMessageThreadNotificationEmail,
  messageThreadNotificationSubject,
} from 'src/modules/notification/emails/templates/message-thread-notification.template';
import { EmailTransportService } from 'src/modules/notification/services/email-transport.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const TEN_MINUTES_IN_MS = 10 * 60 * 1000;

@Injectable()
export class MessageNotificationScheduler {
  private readonly logger = new Logger(MessageNotificationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    private readonly emailTransport: EmailTransportService,
  ) {}

  // Run every minute to evaluate which threads need a grouped notification
  @Cron('* * * * *')
  async sendBatchedMessageNotifications() {
    const appUrl = this.configService.get('APP_URL');
    if (!appUrl || !this.emailTransport.isEnabled()) return;

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000); // safety window

    const rawParticipants = await this.prisma.messageThreadParticipant.findMany(
      {
        where: {
          user: {
            email: {
              not: '',
            },
          },
        },
        include: {
          user: {
            select: {
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
              language: true,
            },
          },
          thread: {
            include: {
              messages: {
                where: {
                  activityNotice: null,
                  createdAt: {
                    gte: since,
                  },
                },
                include: {
                  sender: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                  readReceipts: true,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          },
        },
      },
    );

    const participants = rawParticipants as unknown as Array<
      (typeof rawParticipants)[number] & {
        lastNotificationAt: Date | null;
      }
    >;

    if (!participants.length) {
      return;
    }

    const inboxUrl = `${appUrl.replace(/\/$/, '')}/dashboard/messages`;

    for (const participant of participants) {
      const recipientEmail = participant.user?.email;
      if (!recipientEmail) {
        continue;
      }

      const userId = participant.user.userId;
      const lastNotificationAt = participant.lastNotificationAt;
      const unreadMessages = participant.thread.messages.filter((message) => {
        if (message.senderId === userId) {
          return false;
        }

        if (lastNotificationAt && message.createdAt <= lastNotificationAt) {
          return false;
        }

        const hasReadReceipt = message.readReceipts.some(
          (rr) => rr.userId === userId,
        );
        if (hasReadReceipt) {
          return false;
        }

        return true;
      });

      if (unreadMessages.length === 0) {
        continue;
      }

      const lastMessage = unreadMessages[unreadMessages.length - 1];
      const lastMessageAt = lastMessage.createdAt;

      if (now.getTime() - lastMessageAt.getTime() < TEN_MINUTES_IN_MS) {
        continue;
      }

      const language = participant.user.language ?? Language.FR;

      try {
        const { html, text } = buildMessageThreadNotificationEmail({
          threadTitle: participant.thread.title,
          messages: unreadMessages.map((message) => {
            const senderFirstName = message.sender.firstName || '';
            const senderLastName = message.sender.lastName || '';
            const senderName =
              `${senderFirstName} ${senderLastName}`.trim() || 'OpenAthlete';

            const content = message.content || '';
            const snippet =
              content.length > 240
                ? `${content.slice(0, 237).trimEnd()}...`
                : content;

            return {
              senderName,
              contentSnippet: snippet,
              createdAtIso: message.createdAt.toISOString(),
            };
          }),
          inboxUrl,
          language,
        });

        await this.emailTransport.send({
          to: recipientEmail,
          subject: messageThreadNotificationSubject(language),
          html,
          text,
        });
        await (
          this.prisma as unknown as {
            messageThreadParticipant: {
              update: (args: {
                where: { messageThreadParticipantId: number };
                data: { lastNotificationAt: Date };
              }) => Promise<void>;
            };
          }
        ).messageThreadParticipant.update({
          where: {
            messageThreadParticipantId: participant.messageThreadParticipantId,
          },
          data: {
            lastNotificationAt: lastMessageAt,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send message-thread-notification email to ${maskEmail(recipientEmail)} for thread ${participant.messageThreadId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
