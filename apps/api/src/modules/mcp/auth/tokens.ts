import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Prefixes make leaked tokens recognizable by secret scanners and tell
 * apart the kinds of tokens in logs and support requests.
 */
export const TOKEN_PREFIX = {
  personal: 'oa_pat_',
  access: 'oa_at_',
  refresh: 'oa_rt_',
  code: 'oa_ac_',
  clientSecret: 'oa_cs_',
} as const;

/** A random 256-bit token, base64url, after its prefix */
export function generateToken(prefix: string): string {
  return `${prefix}${randomBytes(32).toString('base64url')}`;
}

/**
 * Tokens are random and long: unlike passwords, a plain SHA-256 cannot be
 * reversed by guessing, and it lets a token be found by an indexed lookup.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function sameHash(token: string, hash: string): boolean {
  const actual = Buffer.from(hashToken(token), 'hex');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** RFC 7636 S256: BASE64URL(SHA256(verifier)) */
export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}
