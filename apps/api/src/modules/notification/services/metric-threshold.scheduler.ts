import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { isOutsideThreshold } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { metricThresholdNotification } from '../push/metric-threshold';
import { PushNotificationService } from './push-notification.service';

const DAY_MS = 24 * 3600 * 1000;
/** A value recorded late about an old day is no news */
const RECENT_DAYS = 2;

/**
 * Tells coaches when a metric they watch goes past their bounds: each new
 * value is checked once, and notified when outside. The API and the worker
 * both run this job: a threshold is claimed by moving its last checked
 * value before the push goes out.
 */
@Injectable()
export class MetricThresholdScheduler {
  private readonly logger = new Logger(MetricThresholdScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Cron('*/15 * * * *')
  async notifyCrossedThresholds(now = new Date()): Promise<number> {
    const thresholds = await this.prisma.coachMetricThreshold.findMany({
      select: {
        metricThresholdId: true,
        metricType: true,
        min: true,
        max: true,
        lastCheckedAt: true,
        athleteId: true,
        coach: { select: { userId: true, language: true } },
        athlete: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    let notified = 0;
    for (const threshold of thresholds) {
      const latest = await this.prisma.athleteMetric.findFirst({
        where: {
          athleteId: threshold.athleteId,
          type: threshold.metricType,
          updatedAt: { gt: threshold.lastCheckedAt },
        },
        orderBy: { updatedAt: 'desc' },
        select: { value: true, date: true, updatedAt: true },
      });
      if (!latest) continue;

      const claimed = await this.prisma.coachMetricThreshold.updateMany({
        where: {
          metricThresholdId: threshold.metricThresholdId,
          lastCheckedAt: threshold.lastCheckedAt,
        },
        data: { lastCheckedAt: latest.updatedAt },
      });
      if (claimed.count === 0) continue;
      if (latest.date.getTime() < now.getTime() - RECENT_DAYS * DAY_MS) {
        continue;
      }
      if (!isOutsideThreshold(latest.value, threshold)) continue;

      const { firstName, lastName } = threshold.athlete.user;
      const { title, body } = metricThresholdNotification(
        threshold.coach.language as Language,
        `${firstName} ${lastName}`.trim(),
        threshold.metricType,
        latest.value,
        threshold,
      );
      const delivered = await this.pushNotificationService.sendPushNotification(
        {
          userId: threshold.coach.userId,
          title,
          body,
          data: {
            type: 'metric_threshold',
            athleteId: String(threshold.athleteId),
            metricType: threshold.metricType,
          },
        },
      );
      if (delivered) notified++;
    }
    if (notified > 0) this.logger.log(`Sent ${notified} metric alerts`);
    return notified;
  }
}
