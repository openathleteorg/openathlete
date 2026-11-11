import { LifecycleEmailKind } from '@openathlete/database';

/**
 * Tags a link of a lifecycle email, so that the visit it brings is credited
 * to that email in the app's and the website's analytics.
 */
export function campaignLink(url: string, kind: LifecycleEmailKind): string {
  const link = new URL(url);
  link.searchParams.set('utm_source', 'openathlete');
  link.searchParams.set('utm_medium', 'email');
  link.searchParams.set('utm_campaign', kind.toLowerCase());
  return link.toString();
}
