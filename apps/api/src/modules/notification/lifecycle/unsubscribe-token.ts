import { createHmac, timingSafeEqual } from 'node:crypto';

/** The emails a person can turn off, each with its own setting */
export const EMAIL_LISTS = ['tips', 'recap', 'news'] as const;
export type EmailList = (typeof EMAIL_LISTS)[number];

function signature(secret: string, payload: string) {
  // Its own key, so a token of one kind can never pass for another
  return createHmac('sha256', `unsubscribe:${secret}`)
    .update(payload)
    .digest('base64url');
}

/**
 * Token of the unsubscribe links: who and which list, signed. It does not
 * expire, as links in old emails must keep working; it can only turn one
 * kind of email off or on again.
 */
export function createUnsubscribeToken(
  secret: string,
  userId: number,
  list: EmailList,
): string {
  const payload = `${userId}.${list}`;
  return `${payload}.${signature(secret, payload)}`;
}

export function readUnsubscribeToken(
  secret: string,
  token: string,
): { userId: number; list: EmailList } | null {
  const [id, list, given, ...rest] = token.split('.');
  if (rest.length > 0 || !id || !list || !given) return null;
  if (!/^\d+$/.test(id) || !(EMAIL_LISTS as readonly string[]).includes(list)) {
    return null;
  }
  const expected = Buffer.from(signature(secret, `${id}.${list}`));
  const received = Buffer.from(given);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }
  return { userId: Number(id), list: list as EmailList };
}
