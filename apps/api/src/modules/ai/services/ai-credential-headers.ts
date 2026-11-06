import { randomUUID } from 'node:crypto';

import { AiCredentialHeaders } from '@openathlete/shared';

/** OpenCode Go routes requests by the session they belong to. */
export const OPENCODE_GO_PROVIDER = 'opencode-go';

const OPENCODE_SESSION_HEADER = 'x-opencode-session';

/** HTTP header names are case-insensitive: store and merge them lowercased. */
export function normalizeCredentialHeaders(
  headers: AiCredentialHeaders | undefined,
): AiCredentialHeaders {
  if (!headers) return {};
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name.trim().toLowerCase(),
      value.trim(),
    ]),
  );
}

/** Reads the headers stored encrypted on a credential. */
export function parseCredentialHeaders(json: string): AiCredentialHeaders {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        )
        .map(([name, value]) => [name.toLowerCase(), value]),
    );
  } catch {
    return {};
  }
}

/**
 * Headers the provider needs on every call. OpenCode Go asks for a stable
 * session per conversation; OpenAthlete does not keep conversations, so each
 * model call is its own session.
 */
export function providerHeaders(provider: string): Record<string, string> {
  return provider === OPENCODE_GO_PROVIDER
    ? { [OPENCODE_SESSION_HEADER]: randomUUID() }
    : {};
}

/** Provider headers first, then the key's own, which may override them. */
export function mergeCredentialHeaders(
  provider: string,
  custom: AiCredentialHeaders,
): Record<string, string> {
  const headers = { ...custom };
  for (const [name, value] of Object.entries(providerHeaders(provider))) {
    if (!Object.keys(headers).some((item) => item.toLowerCase() === name)) {
      headers[name] = value;
    }
  }
  return headers;
}
