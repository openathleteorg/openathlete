import { getApiBaseUrl } from './capacitor';
import {
  ACCESS_TOKEN,
  AUTH_LOGIN_ATTEMPT,
  AUTH_SESSION_OWNER,
  AUTH_TOKEN_GENERATION,
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
 * token can still be recognised after a same-owner refresh. Both counters are
 * persisted, without secrets, so a reload or another tab sharing this storage
 * sees the same boundary. A request may only publish a user or install a
 * refreshed token while the owner and instance are still current.
 */
export type AuthSessionSnapshot = {
  /** Changes only when a login starts or ends, not when tokens rotate. */
  owner: number;
  /** Monotonic counter, bumped on every token install, rotation or clear. */
  generation: number;
  /** `null` for an unauthenticated bootstrap. */
  accessToken: string | null;
  /** The API instance the attempt was started against. */
  instanceURL: string;
};

/** Kept for the existing API surface: a snapshot is the attempt. */
export type AuthAttempt = AuthSessionSnapshot;

/**
 * A login request started by one of the auth hooks. The newest-started attempt
 * may commit its returned session; older responses must never overwrite it.
 */
export type AuthLoginAttempt = {
  ticket: number;
  owner: number;
  instanceURL: string;
};

function readCounter(key: string): number {
  const value = Number(getItem(key));
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

function writeCounter(key: string, value: number): void {
  setItem(key, String(value));
}

function currentOwner(): number {
  return readCounter(AUTH_SESSION_OWNER);
}

function currentGeneration(): number {
  return readCounter(AUTH_TOKEN_GENERATION);
}

export function authTokenGeneration(): number {
  return currentGeneration();
}

/** Snapshot of the owner, token, instance and generation at this moment. */
export function captureAuthSession(): AuthSessionSnapshot {
  return {
    owner: currentOwner(),
    generation: currentGeneration(),
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
  const nextOwner = currentOwner() + 1;
  const nextGeneration = currentGeneration() + 1;
  writeCounter(AUTH_SESSION_OWNER, nextOwner);
  writeCounter(AUTH_TOKEN_GENERATION, nextGeneration);
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
  writeCounter(AUTH_TOKEN_GENERATION, currentGeneration() + 1);
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
  writeCounter(AUTH_SESSION_OWNER, currentOwner() + 1);
  writeCounter(AUTH_TOKEN_GENERATION, currentGeneration() + 1);
  removeItem(ACCESS_TOKEN);
  removeItem(REFRESH_TOKEN);
  return true;
}

/**
 * A 401 ends this login's credentials without replacing the login itself. The
 * owner stays, so a sign-out already waiting for native cleanup can still
 * finish; the bumped generation invalidates every exact credential attempt.
 */
export function invalidateAuthTokens(): void {
  writeCounter(AUTH_TOKEN_GENERATION, currentGeneration() + 1);
  removeItem(ACCESS_TOKEN);
  removeItem(REFRESH_TOKEN);
}

/** Begin a login request that may only commit while it is the newest one. */
export function beginAuthLogin(): AuthLoginAttempt {
  const ticket = readCounter(AUTH_LOGIN_ATTEMPT) + 1;
  writeCounter(AUTH_LOGIN_ATTEMPT, ticket);
  return {
    ticket,
    owner: currentOwner(),
    instanceURL: getApiBaseUrl(),
  };
}

/**
 * Commit a successful login only if no newer attempt started and neither the
 * owner nor the API instance changed while the request was in flight.
 */
export function commitAuthLogin(
  attempt: AuthLoginAttempt,
  accessToken: string,
  refreshToken?: string,
): AuthSessionSnapshot | null {
  if (attempt.ticket !== readCounter(AUTH_LOGIN_ATTEMPT)) return null;
  if (attempt.owner !== currentOwner()) return null;
  if (attempt.instanceURL !== getApiBaseUrl()) return null;
  return installAuthTokens(accessToken, refreshToken);
}

/** True while a continuation still belongs to the same owner and instance. */
export function isAuthSessionCurrent(snapshot: AuthSessionSnapshot): boolean {
  return (
    currentOwner() === snapshot.owner &&
    getApiBaseUrl() === snapshot.instanceURL
  );
}

/** True only while this exact owner, token and generation are installed. */
export function isAuthAttemptCurrent(attempt: AuthAttempt): boolean {
  return (
    isAuthSessionCurrent(attempt) &&
    currentGeneration() === attempt.generation &&
    getItem(ACCESS_TOKEN) === attempt.accessToken
  );
}
