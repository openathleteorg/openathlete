import { Injectable, Logger, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AiKeySource, AiTask } from '@openathlete/database';
import {
  AI_ALLOWANCE_WARNING_SHARE,
  AiAccessSource,
  AiFeatureTask,
  AiUsageDto,
} from '@openathlete/shared';

import { hostedCallCostMicroUsd } from 'src/common/constants/ai-models.constant';
import {
  addDaysToDateKey,
  startOfZonedDay,
  validTimeZone,
  zonedClock,
} from 'src/common/utils/time-zone';
import { VoiceTranscribedEvent } from 'src/events/voice-transcribed.event';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';

import { AiPolicyService } from './ai-policy.service';

/** Token counts as providers report them; some may leave them out. */
export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
}

/** The call a usage belongs to: who paid, for which feature, on which model. */
export interface AiUsageOwner {
  userId: number;
  task: AiFeatureTask;
  source: AiAccessSource;
  provider: string;
  modelId: string;
}

/** Whisper's price: 0.006 USD a minute */
const TRANSCRIPTION_MICRO_USD_PER_SECOND = 100;

const KEY_SOURCES: Record<AiAccessSource, AiKeySource> = {
  own_key: AiKeySource.OWN_KEY,
  hosted: AiKeySource.HOSTED,
};

/** A calendar date (YYYY-MM-DD) as Prisma reads and writes `@db.Date`. */
function dateColumn(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/**
 * The week the allowance counts: from Monday to Sunday in the user's time
 * zone, the rhythm of a training week. Dates are local calendar days.
 */
export function allowanceWeek(now: Date, timeZone: string) {
  const zone = validTimeZone(timeZone);
  const today = zonedClock(now, zone).date;
  // 0 is Sunday: go back to the last Monday
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const monday = addDaysToDateKey(today, -((weekday + 6) % 7));
  const nextMonday = addDaysToDateKey(monday, 7);
  return {
    today,
    monday,
    nextMonday,
    resetsAt: startOfZonedDay(nextMonday, zone),
  };
}

const tokens = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;

/**
 * Counts the tokens of every AI call per user and day, and enforces the
 * weekly allowance on the instance keys: calls on the instance keys are
 * charged at their model's price, since output tokens cost several times
 * more than input ones. Days are the user's local ones, so that the week
 * starts at their Monday midnight.
 *
 * The allowance is checked before a call and charged after it, so calls
 * running at the same time can each go a little over: one call's worth at
 * most.
 *
 * What the instance keys cost never leaves the server: the app gets a
 * share, analytics a threshold crossed, and logs no amounts.
 */
@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: AiPolicyService,
    private readonly subscriptions: SubscriptionService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  /** Adds a successful call to the day's count. Never fails the call. */
  async record(
    owner: AiUsageOwner,
    usage: TokenUsage | undefined,
    now = new Date(),
  ): Promise<void> {
    const inputTokens = tokens(usage?.inputTokens);
    const outputTokens = tokens(usage?.outputTokens);
    // Own keys are billed to the user by their provider
    const costMicroUsd =
      owner.source === 'hosted'
        ? hostedCallCostMicroUsd(
            `${owner.provider}/${owner.modelId}`,
            inputTokens,
            outputTokens,
          )
        : 0;
    try {
      const timeZone = await this.timeZoneOf(owner.userId);
      const week = allowanceWeek(now, timeZone);
      const key = {
        userId: owner.userId,
        day: dateColumn(week.today),
        task: owner.task,
        source: KEY_SOURCES[owner.source],
      };
      await this.prisma.aiUsage.upsert({
        where: { userId_day_task_source: key },
        create: { ...key, inputTokens, outputTokens, costMicroUsd, calls: 1 },
        update: {
          inputTokens: { increment: inputTokens },
          outputTokens: { increment: outputTokens },
          costMicroUsd: { increment: costMicroUsd },
          calls: { increment: 1 },
        },
      });
      if (costMicroUsd > 0) {
        await this.reportThresholds(owner.userId, week, costMicroUsd);
      }
    } catch (error) {
      this.logger.warn(
        `Could not record AI usage of user ${owner.userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Counts a voice note transcribed on the instance's OpenAI key, priced by
   * its length. It never blocks: transcription is free for everyone.
   */
  @OnEvent(VoiceTranscribedEvent.SLUG, { async: true })
  async onVoiceTranscribed({ payload }: VoiceTranscribedEvent): Promise<void> {
    await this.recordTranscription(payload.userId, payload.seconds);
  }

  async recordTranscription(
    userId: number,
    seconds: number,
    now = new Date(),
  ): Promise<void> {
    try {
      const week = allowanceWeek(now, await this.timeZoneOf(userId));
      const costMicroUsd = Math.round(
        Math.max(0, seconds) * TRANSCRIPTION_MICRO_USD_PER_SECOND,
      );
      const key = {
        userId,
        day: dateColumn(week.today),
        task: AiTask.VOICE_TRANSCRIPTION,
        source: AiKeySource.HOSTED,
      };
      await this.prisma.aiUsage.upsert({
        where: { userId_day_task_source: key },
        create: { ...key, costMicroUsd, calls: 1 },
        update: {
          costMicroUsd: { increment: costMicroUsd },
          calls: { increment: 1 },
        },
      });
      if (costMicroUsd > 0) {
        await this.reportThresholds(userId, week, costMicroUsd);
      }
    } catch (error) {
      this.logger.warn(
        `Could not record a transcription of user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Whether the user may still run calls on the instance keys this week. */
  async hasHostedAllowanceLeft(userId: number, now = new Date()) {
    const allowance = await this.allowanceMicroUsd(userId);
    if (allowance === undefined) return true;
    const week = allowanceWeek(now, await this.timeZoneOf(userId));
    const { hostedCostMicroUsd } = await this.weekTotals(userId, week);
    return hostedCostMicroUsd < allowance;
  }

  async describe(userId: number, now = new Date()): Promise<AiUsageDto> {
    const week = allowanceWeek(now, await this.timeZoneOf(userId));
    const { hostedCostMicroUsd, ownKeyTokens } = await this.weekTotals(
      userId,
      week,
    );
    const allowance = await this.allowanceMicroUsd(userId);
    return {
      ownKeyTokens,
      hostedBudgetUsed: usedShare(hostedCostMicroUsd, allowance),
      resetsAt: week.resetsAt.toISOString(),
    };
  }

  /** The user's weekly allowance in millionths of a dollar; undefined: none. */
  private async allowanceMicroUsd(userId: number): Promise<number | undefined> {
    const { offer } = await this.subscriptions.offerForUser(userId);
    const allowance = this.policy.weeklyAllowanceUsd(offer);
    return allowance === undefined
      ? undefined
      : Math.round(allowance * 1_000_000);
  }

  /** Tells analytics when a call crosses the warning share or empties it. */
  private async reportThresholds(
    userId: number,
    week: ReturnType<typeof allowanceWeek>,
    costMicroUsd: number,
  ): Promise<void> {
    if (!this.analytics?.enabled) return;
    const allowance = await this.allowanceMicroUsd(userId);
    if (!allowance) return;
    const { hostedCostMicroUsd: after } = await this.weekTotals(userId, week);
    const before = after - costMicroUsd;
    const { offer, isFounder } = await this.subscriptions.offerForUser(userId);
    const properties = { offer, founder: isFounder, week: week.monday };
    if (before < allowance && after >= allowance) {
      this.analytics.send(userId, 'ai_allowance_exhausted', properties);
    } else if (
      before < allowance * AI_ALLOWANCE_WARNING_SHARE &&
      after >= allowance * AI_ALLOWANCE_WARNING_SHARE
    ) {
      this.analytics.send(userId, 'ai_allowance_warning', properties);
    }
  }

  private async timeZoneOf(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { timeZone: true },
    });
    return validTimeZone(user?.timeZone);
  }

  private async weekTotals(
    userId: number,
    week: ReturnType<typeof allowanceWeek>,
  ) {
    const rows = await this.prisma.aiUsage.groupBy({
      by: ['source'],
      where: {
        userId,
        day: { gte: dateColumn(week.monday), lt: dateColumn(week.nextMonday) },
      },
      _sum: { inputTokens: true, outputTokens: true, costMicroUsd: true },
    });
    const sum = (source: AiKeySource) =>
      rows.find((item) => item.source === source)?._sum;
    const own = sum(AiKeySource.OWN_KEY);
    return {
      ownKeyTokens: (own?.inputTokens ?? 0) + (own?.outputTokens ?? 0),
      hostedCostMicroUsd: sum(AiKeySource.HOSTED)?.costMicroUsd ?? 0,
    };
  }
}

/** Share of the allowance used, from 0 to 1; null when unlimited. */
function usedShare(
  costMicroUsd: number,
  allowance: number | undefined,
): number | null {
  if (allowance === undefined) return null;
  if (allowance <= 0) return 1;
  return Math.min(1, costMicroUsd / allowance);
}
