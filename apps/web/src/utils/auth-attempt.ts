import { getApiBaseUrl } from './capacitor';
import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  getItem,
  removeItem,
  setItem,
} from './local-storage';

/**
 * The exact session an auth request belongs to. A request may only publish a
 * user (or install a refreshed token) while this snapshot is still current:
 * another login in the same tab otherwise wins the bearer while an older
 * `getMe` response is still in flight.
 */
export type AuthAttempt = {
  /** `null` for an unauthenticated bootstrap. */
  accessToken: string | null;
  /** The API instance the attempt was started against. */
  instanceURL: string;
  /** Monotonic module counter, bumped on every token install or clear. */
  generation: number;
};

let generation = 0;

export function authTokenGeneration(): number {
  return generation;
}

/** Snapshot of the token, instance and generation at this exact moment. */
export function captureAuthAttempt(): AuthAttempt {
  return {
    accessToken: getItem(ACCESS_TOKEN),
    instanceURL: getApiBaseUrl(),
    generation,
  };
}

/**
 * Install a new session atomically with respect to other in-flight auth work.
 * Every write path uses this instead of `setItem(ACCESS_TOKEN, …)` so a stale
 * refresh or logout can be detected by generation.
 */
export function installAuthTokens(
  accessToken: string,
  refreshToken?: string,
): AuthAttempt {
  generation += 1;
  setItem(ACCESS_TOKEN, accessToken);
  if (refreshToken) setItem(REFRESH_TOKEN, refreshToken);
  return captureAuthAttempt();
}

/** Clear the session and invalidate every older attempt. */
export function clearAuthTokens(): void {
  generation += 1;
  removeItem(ACCESS_TOKEN);
  removeItem(REFRESH_TOKEN);
}

/** True only while this exact token, instance and generation are installed. */
export function isAuthAttemptCurrent(attempt: AuthAttempt): boolean {
  return (
    generation === attempt.generation &&
    getItem(ACCESS_TOKEN) === attempt.accessToken &&
    getApiBaseUrl() === attempt.instanceURL
  );
}
