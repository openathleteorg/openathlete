import axios, { AxiosInstance } from 'axios';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';

export interface SendPushNotificationParams {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly httpClient: AxiosInstance;
  private readonly firebaseFunctionsUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    this.firebaseFunctionsUrl =
      this.configService.get('FIREBASE_FUNCTIONS_URL') ?? '';

    this.httpClient = axios.create({
      timeout: 10000,
    });
  }

  async sendPushNotification(
    params: SendPushNotificationParams,
  ): Promise<boolean> {
    const { userId, title, body, data } = params;

    try {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { push_token: true, user_id: true },
      });

      if (!user || !user.push_token) {
        this.logger.debug(
          `User ${userId} does not have a push token registered`,
        );
        return false;
      }

      if (!this.firebaseFunctionsUrl) {
        this.logger.warn(
          'FIREBASE_FUNCTIONS_URL is not configured, skipping push notification',
        );
        return false;
      }

      const response = await this.httpClient.post(
        `${this.firebaseFunctionsUrl}/sendPushNotification`,
        {
          token: user.push_token,
          title,
          body,
          data,
        },
      );

      if (response.data.success) {
        this.logger.log(
          `Push notification sent successfully to user ${userId}`,
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to user ${userId}:`,
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  async sendPushNotificationToUsers(
    userIds: number[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        this.sendPushNotification({ userId, title, body, data }),
      ),
    );

    const successCount = results.filter(
      (result) => result.status === 'fulfilled' && result.value === true,
    ).length;

    this.logger.log(
      `Sent push notifications to ${successCount}/${userIds.length} users`,
    );

    return successCount;
  }
}
