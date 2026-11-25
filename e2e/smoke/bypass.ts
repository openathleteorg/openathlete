import type { BrowserContext } from '@playwright/test';

import { BASE_URL } from './playwright.config';

const APP_ORIGIN = new URL(BASE_URL).origin;

/**
 * Vercel's Security Checkpoint challenges a headless browser now and then,
 * even from an allowed IP. With the project's Protection Bypass for Automation
 * secret, requests to the app skip it. Only the app's own origin gets the
 * header: on the API it would trigger a CORS preflight it does not allow.
 */
export async function bypassVercelChallenge(context: BrowserContext) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return;
  await context.route(
    (url) => url.origin === APP_ORIGIN,
    (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          'x-vercel-protection-bypass': secret,
          'x-vercel-set-bypass-cookie': 'true',
        },
      }),
  );
}
