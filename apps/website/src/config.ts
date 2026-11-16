import {
  BillingInterval,
  OFFERS,
  Offer,
  tierPrices,
} from '@openathlete/shared';

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://app.openathlete.org';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://openathlete.org';
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/openathlete';
export const GITHUB_URL = 'https://github.com/openathleteorg/openathlete';
export const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=org.openathlete';
export const DISCORD_URL = 'https://discord.gg/j4PP6tDwuP';
export const DOCS_URL = 'https://docs.openathlete.org';
export const SELF_HOSTING_DOCS_URL = `${DOCS_URL}/docs/getting-started/self-hosting`;
export const MCP_URL = 'https://api.openathlete.org/mcp';
export const CONTACT_EMAIL = 'contact@openathlete.org';

const euros = (cents: readonly number[]) => cents.map((amount) => amount / 100);

/**
 * Supporter tiers of the hosted instance, in euros, VAT included, read from
 * the offers table of libs/shared. Tiers have the same content: a higher one
 * is a bigger contribution.
 */
export const SUPPORTER_MONTHLY_TIERS_EUR = euros(
  tierPrices(Offer.SUPPORTER, BillingInterval.MONTH),
);
export const SUPPORTER_YEARLY_TIERS_EUR = euros(
  tierPrices(Offer.SUPPORTER, BillingInterval.YEAR),
);
/** The tier shown first and preselected. */
export const SUPPORTER_FEATURED_TIER = OFFERS[Offer.SUPPORTER].featuredTier;

/**
 * The lowest tier: the "from" price, and what a coach pays to lift the
 * athlete limit, which every tier does.
 */
export const SUPPORTER_MONTHLY_EUR = SUPPORTER_MONTHLY_TIERS_EUR[0];
export const SUPPORTER_YEARLY_EUR = SUPPORTER_YEARLY_TIERS_EUR[0];
