import type { EmailLanguage } from '@openathlete/shared';

import { EmailFooter } from '../emails/core/layout';
import { LIST_REASONS } from './email-lists';
import { EmailList, createUnsubscribeToken } from './unsubscribe-token';

/** What an email a person can turn off needs from the instance's settings */
export interface ListEmailConfig {
  secret: string;
  appUrl: string;
  apiUrl: string;
}

/** The foot of the email: why it came, and the links to stop it */
export function listFooter(
  config: ListEmailConfig,
  userId: number,
  list: EmailList,
  language: EmailLanguage,
): EmailFooter {
  const token = createUnsubscribeToken(config.secret, userId, list);
  return {
    kind: 'list',
    reason: LIST_REASONS[list][language],
    unsubscribeUrl: `${config.appUrl}/emails/unsubscribe?token=${token}`,
    preferencesUrl: `${config.appUrl}/dashboard/settings?tab=profile`,
  };
}

/** One-click unsubscribe for mail clients (RFC 8058) */
export function unsubscribeHeaders(
  config: ListEmailConfig,
  userId: number,
  list: EmailList,
): Record<string, string> {
  const token = createUnsubscribeToken(config.secret, userId, list);
  return {
    'List-Unsubscribe': `<${config.apiUrl}/emails/unsubscribe?token=${token}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/** The person who signs, then the instance's sender name */
export function signedSenderName(
  signature: string,
  instanceName: string | undefined,
) {
  const instance = instanceName || 'OpenAthlete';
  return instance.includes(signature) ? instance : `${signature} · ${instance}`;
}
