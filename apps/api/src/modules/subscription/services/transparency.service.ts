import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  BillingInterval as PrismaBillingInterval,
  SubscriptionPlan as PrismaSubscriptionPlan,
  SubscriptionStatus,
} from '@openathlete/database';
import {
  ApiEnvSchemaType,
  BillingInterval,
  SUPPORTER_GOAL,
  TransparencyDto,
  transparencyDtoSchema,
} from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { monthlyRevenueEur, tierProgress, wallNames } from './transparency';

const CACHE_MS = 60 * 60 * 1000;

const TIER_KEYS = [
  'TRANSPARENCY_TIER_1_EUR',
  'TRANSPARENCY_TIER_2_EUR',
  'TRANSPARENCY_TIER_3_EUR',
  'TRANSPARENCY_TIER_4_EUR',
] as const;

/** A small team: shown as a horizon until this threshold is set */
const HORIZON_KEY = 'TRANSPARENCY_TIER_5_EUR';

/**
 * Plans whose subscriptions fund the project. Coach and Club join this list
 * when they go on sale.
 */
const PAID_PLANS = [PrismaSubscriptionPlan.SUPPORTER];

/**
 * The figures of the website's transparency page. The revenue and the tier
 * thresholds stay on the server: only the progress of each tier leaves it.
 */
@Injectable()
export class TransparencyService {
  private cached: { value: TransparencyDto; at: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  async get(now = Date.now()): Promise<TransparencyDto> {
    if (this.cached && now - this.cached.at < CACHE_MS) {
      return this.cached.value;
    }
    const value = await this.compute();
    this.cached = { value, at: now };
    return value;
  }

  /** A Supporter changed their wall choice: show it on the next read */
  invalidate(): void {
    this.cached = null;
  }

  private threshold(
    key: (typeof TIER_KEYS)[number] | typeof HORIZON_KEY,
  ): number | undefined {
    // ConfigService may hand back the raw string of process.env
    const raw: unknown = this.configService.get(key);
    if (raw === undefined || raw === null || raw === '') return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }

  /**
   * Four tiers, or five once the small team has a threshold. A fifth one
   * that does not top the fourth is left out rather than hiding the ladder.
   */
  private tiers(revenue: number): number[] | null {
    const four = TIER_KEYS.map((key) => this.threshold(key));
    const fifth = this.threshold(HORIZON_KEY);
    return (
      (fifth === undefined ? null : tierProgress(revenue, [...four, fifth])) ??
      tierProgress(revenue, four)
    );
  }

  private async compute(): Promise<TransparencyDto> {
    const running = await this.prisma.subscription.findMany({
      where: {
        plan: { in: PAID_PLANS },
        status: {
          in: [SubscriptionStatus.active, SubscriptionStatus.trialing],
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        plan: true,
        amountCents: true,
        billingInterval: true,
        showOnSupporterWall: true,
        wallName: true,
        user: { select: { firstName: true } },
      },
    });
    const supporters = running.filter(
      (row) => row.plan === PrismaSubscriptionPlan.SUPPORTER,
    );

    const revenue = monthlyRevenueEur(
      running.map((row) => ({
        amountCents: row.amountCents,
        billingInterval:
          row.billingInterval === PrismaBillingInterval.year
            ? BillingInterval.YEAR
            : row.billingInterval === PrismaBillingInterval.month
              ? BillingInterval.MONTH
              : null,
      })),
    );

    // Strict parsing: a field added here by mistake fails instead of leaking
    return transparencyDtoSchema.parse({
      supporters: { count: supporters.length, goal: SUPPORTER_GOAL },
      tiers: this.tiers(revenue),
      wall: wallNames(
        supporters.map((row) => ({
          showOnSupporterWall: row.showOnSupporterWall,
          wallName: row.wallName,
          firstName: row.user.firstName,
        })),
      ),
    });
  }
}
