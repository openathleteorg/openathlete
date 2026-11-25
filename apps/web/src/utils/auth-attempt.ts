import { getApiBaseUrl } from './capacitor';
import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  getItem,
  removeItem,
  setItem,
} from './local-storage';

/**
 * The exact auth session a request or authentication flow belongs to.
 *
 * `owner` names the login itself and is stable while refresh tokens rotate.
 * `generation` names the exact credential, so a response that used an older
 * token can still be recognised after a same-owner refresh. A request may only
 * publish a user or install a refreshed token while the owner and instance are
 * still current; another login in the same tab otherwise wins the bearer while
 * an older `getMe` response is still in flight.
 */
export type AuthSessionSnapshot = {
  /** Changes only when a login starts or ends, not when tokens rotate. */
  owner: number;
  /** Monotonic module counter, bumped on every token install or clear. */
  generation: number;
  /** `null` for an unauthenticated bootstrap. */
  accessToken: string | null;
  /** The API instance the attempt was started against. */
  instanceURL: string;
};

/** Kept for the existing API surface: a snapshot is the attempt. */
export type AuthAttempt = AuthSessionSnapshot;

let owner = 0;
let generation = 0;

export function authTokenGeneration(): number {
  return generation;
}

/** Snapshot of the owner, token, instance and generation at this moment. */
export function captureAuthSession(): AuthSessionSnapshot {
  return {
    owner,
    generation,
    accessToken: getItem(ACCESS_TOKEN),
    instanceURL: getApiBaseUrl(),
  };
}

/** @deprecated Prefer `captureAuthSession`, which names the stable owner. */
export const captureAuthAttempt = captureAuthSession;

/**
 * Start a new login session. This invalidates every continuation of the
 * previous owner, including a refresh or logout that has not finished yet.
 */
export function installAuthTokens(
  accessToken: string,
  refreshToken?: string,
): AuthSessionSnapshot {
  owner += 1;
  generation += 1;
  setItem(ACCESS_TOKEN, accessToken);
  if (refreshToken) setItem(REFRESH_TOKEN, refreshToken);
  return captureAuthSession();
}

/**
 * Rotate the credential of the session that started the refresh. A refresh is
 * not a new owner: same-owner continuations stay current, while a successor
 * login makes this return null instead of overwriting its tokens.
 */
export function rotateAuthTokens(
  expected: AuthSessionSnapshot,
  accessToken: string,
  refreshToken?: string,
): AuthSessionSnapshot | null {
  // The refresh caller already fenced its exact refresh token against a
  // concurrent rotation; here only the owner and instance must still match.
  if (!isAuthSessionCurrent(expected)) return null;
  generation += 1;
  setItem(ACCESS_TOKEN, accessToken);
  if (refreshToken) setItem(REFRESH_TOKEN, refreshToken);
  return captureAuthSession();
}

/**
 * Clear the session, but never one that replaced the caller's. Logout passes
 * the snapshot it captured before waiting for native cleanup, so a successor
 * login's tokens survive a late continuation.
 */
export function clearAuthTokens(expected?: AuthSessionSnapshot): boolean {
  if (expected && !isAuthSessionCurrent(expected)) return false;
  owner += 1;
  generation += 1;
  removeItem(ACCESS_TOKEN);
  removeItem(REFRESH_TOKEN);
  return true;
}

/** True while a continuation still belongs to the same owner and instance. */
export function isAuthSessionCurrent(snapshot: AuthSessionSnapshot): boolean {
  return owner === snapshot.owner && getApiBaseUrl() === snapshot.instanceURL;
}

/** True only while this exact owner, token and generation are installed. */
export function isAuthAttemptCurrent(attempt: AuthAttempt): boolean {
  return (
    isAuthSessionCurrent(attempt) &&
    generation === attempt.generation &&
    getItem(ACCESS_TOKEN) === attempt.accessToken
  );
}
