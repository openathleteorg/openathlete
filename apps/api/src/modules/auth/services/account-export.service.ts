import { Injectable, Logger } from '@nestjs/common';

import { EVENT_INCLUDES } from 'src/modules/core/services/event-includes';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/** Where the export is written: an HTTP response, or a buffer in tests. */
export interface ExportSink {
  write(chunk: string): unknown;
  end(): unknown;
}

export const ACCOUNT_EXPORT_FORMAT = 'openathlete-export-v1';

/** Events are read and written in batches so large accounts stream. */
const EVENT_BATCH = 100;

/**
 * Everything a user can take with them (GDPR right to data portability), as
 * one JSON document. Secrets are never part of it: password hash, provider
 * and push tokens, AI keys. Columns of sensitive tables are listed one by
 * one so that a new secret column cannot leak by default.
 *
 * Activity streams (GPS, heart rate...) are large: they are only included
 * when asked for.
 */
@Injectable()
export class AccountExportService {
  private readonly logger = new Logger(AccountExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async export(
    userId: number,
    sink: ExportSink,
    options: { includeStreams: boolean },
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        gender: true,
        language: true,
        roles: true,
        onboardingCompleted: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            cancelAtPeriodEnd: true,
            createdAt: true,
          },
        },
        athlete: { select: { athleteId: true } },
      },
    });
    const athleteId = user.athlete?.athleteId;

    const write = (key: string, value: unknown, last = false) =>
      sink.write(
        `${JSON.stringify(key)}:${JSON.stringify(value)}${last ? '' : ','}`,
      );

    sink.write('{');
    write('format', ACCOUNT_EXPORT_FORMAT);
    write('exportedAt', new Date().toISOString());
    write('user', { ...user, athlete: undefined });
    write('athlete', athleteId ? await this.athleteData(athleteId) : null);
    write('coaching', await this.coaching(userId));
    write('templates', await this.templates(userId));
    write('messages', await this.messages(userId));
    write('aiAssistant', await this.aiAssistant(userId));
    write('aiSettings', await this.aiSettings(userId));

    sink.write('"events":[');
    if (athleteId) {
      await this.writeEvents(athleteId, sink, options.includeStreams);
    }
    sink.write(']}');
    sink.end();
    this.logger.log(`Data export for user ${userId}`);
  }

  private async athleteData(athleteId: number) {
    return this.prisma.athlete.findUniqueOrThrow({
      where: { athleteId },
      select: {
        createdAt: true,
        settings: true,
        metrics: { orderBy: { date: 'asc' } },
        trainingZones: { include: { values: true } },
        equipment: true,
        injuries: true,
        availability: true,
        trainingPlans: true,
        cycles: { include: { weeks: true } },
        trainingLoadCalculations: { include: { entries: true } },
        records: true,
        // Connection details only, never the OAuth tokens
        providerAccounts: {
          select: {
            provider: true,
            status: true,
            externalUserId: true,
            scopes: true,
            importActivitiesEnabled: true,
            exportWorkoutsEnabled: true,
            importMetricsEnabled: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /** Who coaches the user and whom they coach, by name. */
  private async coaching(userId: number) {
    const [coaches, athletes] = await Promise.all([
      this.prisma.coachAthlete.findMany({
        where: { athlete: { userId } },
        select: {
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.coachAthlete.findMany({
        where: { userId },
        select: {
          createdAt: true,
          athlete: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
    ]);
    return {
      coaches: coaches.map(({ user, createdAt }) => ({
        ...user,
        since: createdAt,
      })),
      athletes: athletes.map(({ athlete, createdAt }) => ({
        ...athlete.user,
        since: createdAt,
      })),
    };
  }

  private async templates(userId: number) {
    return this.prisma.eventTemplate.findMany({
      where: { userId },
      select: {
        createdAt: true,
        folder: { select: { name: true } },
        event: { include: EVENT_INCLUDES },
      },
    });
  }

  /** Messages the user wrote; other people's messages are theirs. */
  private async messages(userId: number) {
    return this.prisma.message.findMany({
      where: { senderId: userId },
      select: { messageThreadId: true, content: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async aiAssistant(userId: number) {
    return this.prisma.agentThread.findMany({
      where: { userId },
      include: { messages: { include: { blocks: true } } },
    });
  }

  /** Which providers and models are configured, never the keys. */
  private async aiSettings(userId: number) {
    const [credentials, models] = await Promise.all([
      this.prisma.aiCredential.findMany({
        where: { userId },
        select: {
          provider: true,
          label: true,
          apiKeyHint: true,
          baseUrl: true,
          createdAt: true,
        },
      }),
      this.prisma.aiModelPreference.findMany({
        where: { userId },
        select: {
          task: true,
          modelId: true,
          credential: { select: { label: true } },
        },
      }),
    ]);
    return { keys: credentials, models };
  }

  private async writeEvents(
    athleteId: number,
    sink: ExportSink,
    includeStreams: boolean,
  ) {
    let cursor: number | undefined;
    let first = true;
    for (;;) {
      const events = await this.prisma.event.findMany({
        where: { athleteId },
        orderBy: { eventId: 'asc' },
        take: EVENT_BATCH,
        ...(cursor ? { skip: 1, cursor: { eventId: cursor } } : {}),
        include: {
          ...EVENT_INCLUDES,
          activity: {
            include: {
              feedbackQuestions: true,
              segments: true,
              weather: true,
            },
          },
        },
      });
      for (const event of events) {
        const { activity } = event;
        const exported = activity
          ? {
              ...event,
              activity: includeStreams
                ? activity
                : { ...activity, stream: undefined },
            }
          : event;
        sink.write(`${first ? '' : ','}${JSON.stringify(exported)}`);
        first = false;
      }
      if (events.length < EVENT_BATCH) return;
      cursor = events[events.length - 1].eventId;
    }
  }
}
