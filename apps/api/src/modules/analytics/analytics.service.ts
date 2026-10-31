import { createHash, randomUUID } from 'node:crypto';
import { PostHog } from 'posthog-node';

import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../prisma/services/prisma.service';

type Properties = Record<string, string | number | boolean | null | undefined>;

export interface CaptureOptions {
  /** When it happened, if not now */
  timestamp?: Date;
  /** Stable id (a webhook's), so that a retry does not count twice */
  uuid?: string;
  /** Person properties to keep up to date */
  set?: Properties;
}

/** Same key, same id: a retried webhook stays one event in PostHog. */
export function stableUuid(key: string): string {
  const hex = createHash('md5').update(key).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/**
 * Product analytics and error reports, sent to PostHog when POSTHOG_PROJECT_TOKEN
 * is set: every method is a no-op without it, so self-hosted instances send
 * nothing. Reporting must never break the work it observes: nothing here throws.
 */
@Injectable()
export class AnalyticsService implements OnApplicationShutdown {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly client: PostHog | null;
  private flushLogs?: () => Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() configService?: ConfigService<ApiEnvSchemaType, true>,
  ) {
    const token = configService?.get('POSTHOG_PROJECT_TOKEN', { infer: true });
    this.client = token
      ? new PostHog(token, {
          host: configService?.get('POSTHOG_HOST', { infer: true }),
          enableExceptionAutocapture: true,
          flushAt: 20,
          flushInterval: 10_000,
        })
      : null;
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  /** The user's distinct id is the one the web app identifies them with. */
  async capture(
    userId: number,
    event: string,
    properties: Properties = {},
    options: CaptureOptions = {},
  ): Promise<void> {
    if (!this.client) return;
    try {
      const user = await this.prisma.user.findUnique({
        where: { userId },
        select: { analyticsConsentAt: true },
      });
      if (user?.analyticsConsentAt) {
        this.send(userId, event, properties, options);
      }
    } catch (error) {
      this.logger.warn(`Could not send ${event}: ${String(error)}`);
    }
  }

  /** For code that knows the athlete only. */
  async captureForAthlete(
    athleteId: number,
    event: string,
    properties: Properties = {},
  ): Promise<void> {
    if (!this.client) return;
    try {
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId },
        select: { userId: true },
      });
      if (athlete) await this.capture(athlete.userId, event, properties);
    } catch (error) {
      this.logger.warn(`Could not send ${event}: ${String(error)}`);
    }
  }

  /** Sends an event for a user who just consented, or whose row is gone. */
  send(
    userId: number,
    event: string,
    properties: Properties = {},
    { timestamp, uuid, set }: CaptureOptions = {},
  ): void {
    this.client?.capture({
      distinctId: userId.toString(),
      event,
      timestamp,
      uuid,
      properties: { ...properties, ...(set ? { $set: set } : {}) },
    });
  }

  /**
   * Errors are legitimate interest and run without consent, so they name no
   * user. What identifies the failing work belongs in `properties`, as ids.
   */
  captureException(error: unknown, properties: Properties = {}): void {
    this.client?.captureException(error, randomUUID(), {
      ...properties,
      $process_person_profile: false,
    });
  }

  /** The last logs are the ones that explain why a process stopped. */
  flushOnShutdown(flush: () => Promise<void>): void {
    this.flushLogs = flush;
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.allSettled([this.client?.shutdown(), this.flushLogs?.()]);
  }
}
