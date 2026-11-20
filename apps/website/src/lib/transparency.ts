import { API_URL, GITHUB_URL } from '@/config';
import { CONTRIBUTORS_FALLBACK } from '@/content/transparency';

import {
  type TransparencyDto,
  transparencyDtoSchema,
} from '@openathlete/shared';

/** Same lifetime as the API's own cache */
export const TRANSPARENCY_REVALIDATE_SECONDS = 3600;

/**
 * Supporter count, tier progress and wall from the hosted API. Null when it
 * cannot be reached or answers something else (a build without network,
 * an instance that sells nothing): the page then leaves those blocks out.
 */
export async function fetchTransparency(): Promise<TransparencyDto | null> {
  try {
    const response = await fetch(`${API_URL}/transparency`, {
      next: { revalidate: TRANSPARENCY_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const parsed = transparencyDtoSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const CONTRIBUTORS_API = GITHUB_URL.replace(
  'https://github.com/',
  'https://api.github.com/repos/',
).concat('/contributors?per_page=100');

export interface Contributors {
  count: number;
  /** GitHub logins, empty when the list could not be loaded */
  logins: string[];
}

/** Keeps people, drops bots such as dependabot */
function humanContributors(
  list: readonly { login?: unknown; type?: unknown }[],
): string[] {
  return list.flatMap((item) =>
    item.type === 'User' && typeof item.login === 'string' ? [item.login] : [],
  );
}

/**
 * The repository's contributors. GitHub allows 60 anonymous calls an hour
 * per IP, shared with every site on the same Vercel IP: refreshed once a day,
 * and the hand-kept count stands in when the call fails.
 */
export async function fetchContributors(): Promise<Contributors> {
  const fallback = { count: CONTRIBUTORS_FALLBACK, logins: [] };
  try {
    const response = await fetch(CONTRIBUTORS_API, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return fallback;
    const body: unknown = await response.json();
    if (!Array.isArray(body)) return fallback;
    const logins = humanContributors(body);
    return logins.length ? { count: logins.length, logins } : fallback;
  } catch {
    return fallback;
  }
}

export type TierState = 'reached' | 'current' | 'next';

/** Reached tiers are full; the first one that is not is the current one */
export function tierStates(progress: readonly number[]): TierState[] {
  const current = progress.findIndex((percent) => percent < 100);
  return progress.map((percent, index) =>
    percent >= 100 ? 'reached' : index === current ? 'current' : 'next',
  );
}
