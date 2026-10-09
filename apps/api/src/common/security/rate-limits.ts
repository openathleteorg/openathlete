import { ThrottlerModuleOptions } from '@nestjs/throttler';

const MINUTE = 60_000;

/**
 * Per-IP limit applied to every HTTP route unless overridden. Generous: it
 * only guards against scraping and floods, not normal use of the app.
 */
export const DEFAULT_RATE_LIMIT: ThrottlerModuleOptions = [
  { name: 'default', ttl: MINUTE, limit: 600 },
];

/**
 * Stricter per-IP limits for sensitive routes, used with @Throttle().
 * Webhooks and health checks opt out with @SkipThrottle().
 */
export const RATE_LIMITS = {
  /** Password login: slows down credential stuffing */
  login: { default: { limit: 10, ttl: MINUTE } },
  /** Account creation */
  signup: { default: { limit: 10, ttl: 60 * MINUTE } },
  /** Password reset request and confirmation */
  passwordReset: { default: { limit: 5, ttl: 15 * MINUTE } },
  /** Access token refresh */
  tokenRefresh: { default: { limit: 60, ttl: MINUTE } },
  /** Routes that reveal whether an account or invitation exists */
  accountLookup: { default: { limit: 30, ttl: MINUTE } },
  /** Unauthenticated routes that write to the database */
  publicWrite: { default: { limit: 20, ttl: 60 * MINUTE } },
  /** Full account data export: heavy queries */
  dataExport: { default: { limit: 5, ttl: 60 * MINUTE } },
  /** Routes calling an AI provider on the user's key just to check it */
  aiCheck: { default: { limit: 10, ttl: MINUTE } },
  /**
   * Public calendar feed. Google and Apple fetch the feeds of many users from
   * shared addresses, so this only stops floods: each request is one indexed
   * read.
   */
  calendarFeed: { default: { limit: 120, ttl: MINUTE } },
  /**
   * OAuth token and client registration endpoints of the MCP server. MCP
   * clients such as Claude or ChatGPT call them from shared server
   * addresses for all their users, so these only stop floods.
   */
  oauthToken: { default: { limit: 120, ttl: MINUTE } },
  oauthRegister: { default: { limit: 30, ttl: MINUTE } },
  /**
   * MCP requests, per access token rather than per IP (see
   * McpThrottlerGuard): an agent planning a season chains many tool calls.
   */
  mcp: { default: { limit: 240, ttl: MINUTE } },
} as const;
