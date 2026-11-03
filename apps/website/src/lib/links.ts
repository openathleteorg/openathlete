import { APP_URL } from '@/config';

/**
 * Links into the app carry UTM parameters: PostHog records them on the
 * app's first pageview, which ties a signup to the page and the button
 * that brought it.
 */
function withUtm(url: string, placement: string): string {
  const target = new URL(url);
  target.searchParams.set('utm_source', 'website');
  target.searchParams.set('utm_medium', 'cta');
  target.searchParams.set('utm_content', placement);
  return target.toString();
}

export function signupUrl(placement: string, returnTo?: string): string {
  const url = new URL(`${APP_URL}/auth/create-account`);
  if (returnTo) url.searchParams.set('returnTo', returnTo);
  return withUtm(url.toString(), placement);
}

/** Signs up, then lands on the subscription tab of the settings. */
export function supporterUrl(placement: string): string {
  return signupUrl(placement, '/dashboard/settings?tab=subscription');
}

export function loginUrl(placement = 'header'): string {
  return withUtm(`${APP_URL}/auth/login`, placement);
}
