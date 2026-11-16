import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ApiEnvSchemaType,
  Offer,
  referenceMonthlyPriceEur,
} from '@openathlete/shared';

export type HostedAccessPolicy = 'subscribers' | 'everyone' | 'none';

/** Average weeks in a month (52.14 / 12), to spread monthly amounts. */
export const WEEKS_PER_MONTH = 4.345;

/** A number between bounds, or null for an unset or invalid value. */
function parseNumber(
  value: string | undefined,
  { min, max }: { min: number; max: number },
): number | null {
  if (value === undefined || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max
    ? number
    : null;
}

/**
 * Instance-wide AI rules. Without Stripe (self-hosted instances) the operator
 * shares their keys with everyone and may allow local endpoints; with Stripe
 * (the hosted instance) instance keys are a paid feature and the server never
 * calls user-provided URLs.
 */
@Injectable()
export class AiPolicyService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AiPolicyService.name);

  constructor(
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  /**
   * Says at boot when hosted AI is off for a missing or invalid setting,
   * rather than failing to start: the rest of the app works without it.
   */
  onApplicationBootstrap(): void {
    if (!this.billingEnabled || this.hostedMonthlyBudgetUsd !== undefined) {
      return;
    }
    const share = this.configService.get('AI_HOSTED_BUDGET_SHARE');
    const rate = this.configService.get('AI_EUR_TO_USD');
    if (this.shareFor(Offer.SUPPORTER) === null || this.eurToUsd === null) {
      this.logger.error(
        `Hosted AI is off: with Stripe, set AI_HOSTED_BUDGET_SHARE (0 to 1) and AI_EUR_TO_USD (${share ? 'share set' : 'share missing'}, ${rate ? 'rate set' : 'rate missing'}, or invalid)`,
      );
    }
  }

  private get billingEnabled(): boolean {
    return Boolean(this.configService.get('STRIPE_SECRET_KEY'));
  }

  get hostedAccess(): HostedAccessPolicy {
    return (
      this.configService.get('AI_HOSTED_ACCESS') ??
      (this.billingEnabled ? 'subscribers' : 'everyone')
    );
  }

  /** Monthly spend per user on the instance keys (USD); undefined: no limit. */
  get hostedMonthlyBudgetUsd(): number | undefined {
    return this.configService.get('AI_HOSTED_MONTHLY_BUDGET_USD');
  }

  private get eurToUsd(): number | null {
    return parseNumber(this.configService.get('AI_EUR_TO_USD'), {
      min: Number.MIN_VALUE,
      max: 100,
    });
  }

  private shareFor(offer: Offer): number | null {
    const bounds = { min: 0, max: 1 };
    const own = parseNumber(
      this.configService.get(
        `AI_HOSTED_BUDGET_SHARE_${offer}` as keyof ApiEnvSchemaType,
      ) as string | undefined,
      bounds,
    );
    return (
      own ??
      parseNumber(this.configService.get('AI_HOSTED_BUDGET_SHARE'), bounds)
    );
  }

  /**
   * What a user of this offer may spend each week on the instance keys, in
   * US dollars: a share of the offer's reference price. The older monthly
   * budget, when set without a share, applies to every offer. Undefined: no
   * limit (instances without Stripe and without a budget); 0: none.
   */
  weeklyAllowanceUsd(offer: Offer, extraCoaches = 0): number | undefined {
    const price = referenceMonthlyPriceEur(offer, extraCoaches);
    const share = this.shareFor(offer);
    const rate = this.eurToUsd;
    if (this.billingEnabled && price > 0 && share !== null && rate !== null) {
      return (price * share * rate) / WEEKS_PER_MONTH;
    }
    const monthly = this.hostedMonthlyBudgetUsd;
    if (monthly !== undefined) return monthly / WEEKS_PER_MONTH;
    // With Stripe, hosted AI needs a budget: none set means none spent
    return this.billingEnabled ? 0 : undefined;
  }

  /** Users may add OpenAI-compatible endpoints and local providers. */
  get customEndpointsAllowed(): boolean {
    return (
      this.configService.get('AI_ALLOW_CUSTOM_ENDPOINTS') ??
      !this.billingEnabled
    );
  }
}
