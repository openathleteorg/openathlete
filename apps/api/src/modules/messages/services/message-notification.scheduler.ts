import * as brevo from '@getbrevo/brevo';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import type { ApiEnvSchemaType } from '@openathlete/shared';

import { buildMessageThreadNotificationEmail } from 'src/modules/notification/emails/templates/message-thread-notification.template';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const TEN_MINUTES_IN_MS = 10 * 60 * 1000;

@Injectable()
export class MessageNotificationScheduler {
  private readonly logger = new Logger(MessageNotificationScheduler.name);
  private readonly apiInstance: brevo.TransactionalEmailsApi;
  private readonly fromEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    const apiKey = configService.get('BREVO_API_KEY') ?? '';
    this.fromEmail =
      configService.get('BREVO_FROM_EMAIL') ?? 'noreply@openathlete.org';
    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );
  }

  // Run every minute to evaluate which threads need a grouped notification
  @Cron('* * * * *')
  async sendBatchedMessageNotifications() {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000); // safety window

    const rawParticipants =
      await this.prisma.message_thread_participant.findMany({
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
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          thread: {
            include: {
              messages: {
                where: {
                  created_at: {
                    gte: since,
                  },
                },
                include: {
                  sender: {
                    select: {
                      first_name: true,
                      last_name: true,
                    },
                  },
                  read_receipts: true,
                },
                orderBy: {
                  created_at: 'asc',
                },
              },
            },
          },
        },
      });

    const participants = rawParticipants as unknown as Array<
      (typeof rawParticipants)[number] & {
        last_notification_at: Date | null;
      }
    >;

    if (!participants.length) {
      return;
    }

    const appUrl = this.configService.get('APP_URL');
    const inboxUrl = `${appUrl.replace(/\/$/, '')}/dashboard/messages`;

    for (const participant of participants) {
      const recipientEmail = participant.user.email;
      if (!recipientEmail) {
        continue;
      }

      const userId = participant.user.user_id;
      const lastNotificationAt = participant.last_notification_at;
      const unreadMessages = participant.thread.messages.filter((message) => {
        if (message.sender_id === userId) {
          return false;
        }

        if (lastNotificationAt && message.created_at <= lastNotificationAt) {
          return false;
        }

        const hasReadReceipt = message.read_receipts.some(
          (rr) => rr.user_id === userId,
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
      const lastMessageAt = lastMessage.created_at;

      if (now.getTime() - lastMessageAt.getTime() < TEN_MINUTES_IN_MS) {
        continue;
      }

      try {
        const htmlContent = buildMessageThreadNotificationEmail({
          threadTitle: participant.thread.title,
          messages: unreadMessages.map((message) => {
            const senderFirstName = message.sender.first_name || '';
            const senderLastName = message.sender.last_name || '';
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
              createdAtIso: message.created_at.toISOString(),
            };
          }),
          inboxUrl,
        });

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: recipientEmail }];
        sendSmtpEmail.sender = {
          email: this.fromEmail,
          name: 'OpenAthlete',
        };
        sendSmtpEmail.subject =
          'Nouveaux messages dans votre messagerie OpenAthlete';
        sendSmtpEmail.htmlContent = htmlContent;

        await this.apiInstance.sendTransacEmail(sendSmtpEmail);
        await (
          this.prisma as unknown as {
            message_thread_participant: {
              update: (args: {
                where: { message_thread_participant_id: number };
                data: { last_notification_at: Date };
              }) => Promise<void>;
            };
          }
        ).message_thread_participant.update({
          where: {
            message_thread_participant_id:
              participant.message_thread_participant_id,
          },
          data: {
            last_notification_at: lastMessageAt,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send message-thread-notification email to ${recipientEmail} for thread ${participant.message_thread_id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
