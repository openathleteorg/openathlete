import { createHmac, timingSafeEqual } from 'node:crypto';

/** Svix (which signs the Resend webhooks) refuses messages older than this */
const TOLERANCE_SECONDS = 5 * 60;

export interface SvixHeaders {
  id?: string;
  timestamp?: string;
  signature?: string;
}

/**
 * Checks a Svix signature: HMAC-SHA256 of `id.timestamp.body` with the
 * base64 secret (after its `whsec_` prefix), compared with each `v1,<sig>` of
 * the header, which holds several while a secret is being rotated.
 */
export function verifySvixSignature(
  secret: string,
  rawBody: Buffer | string,
  headers: SvixHeaders,
  now: Date = new Date(),
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  if (Math.abs(now.getTime() / 1000 - sentAt) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.`)
    .update(rawBody)
    .digest();

  return signature.split(' ').some((candidate) => {
    const [version, value] = candidate.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
