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
 * token can still be recognised after a same-owner refresh. Both are opaque
 * IDs persisted without secrets, so a reload or another tab sharing this
 * storage sees the same boundary without relying on a shared counter.
 */
export type AuthSessionSnapshot = {
  /** Changes only when a login starts or ends, not when tokens rotate. */
  owner: string;
  /** Changes on every token install, rotation or invalidation. */
  generation: string;
  /** `null` for an unauthenticated bootstrap. */
  accessToken: string | null;
  /** The API instance the attempt was started against. */
  instanceURL: string;
};

/** Kept for the existing API surface: a snapshot is the attempt. */
export type AuthAttempt = AuthSessionSnapshot;

/**
 * A login request started by one of the auth hooks. The ID last published in
 * storage is the only attempt allowed to commit; no counter is read+written.
 */
export type AuthLoginAttempt = AuthSessionSnapshot & {
  ticket: string;
};

/** The boundary before the first login or after storage was reset. */
const NO_SESSION_ID = 'none';

function createAuthId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  // Non-secret uniqueness fallback for environments without randomUUID.
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function readAuthId(key: string): string {
  const value = getItem(key);
  return value && value.length > 0 ? value : NO_SESSION_ID;
}

function currentOwner(): string {
  return readAuthId(AUTH_SESSION_OWNER);
}

function currentGeneration(): string {
  return readAuthId(AUTH_TOKEN_GENERATION);
}

export function authTokenGeneration(): string {
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
  // Publish credentials first and the owner last. A reader in another context
  // can therefore never see the new owner paired with the previous bearer.
  if (refreshToken) setItem(REFRESH_TOKEN, refreshToken);
  setItem(ACCESS_TOKEN, accessToken);
  setItem(AUTH_TOKEN_GENERATION, createAuthId());
  setItem(AUTH_SESSION_OWNER, createAuthId());
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
  if (refreshToken) setItem(REFRESH_TOKEN, refreshToken);
  setItem(ACCESS_TOKEN, accessToken);
  setItem(AUTH_TOKEN_GENERATION, createAuthId());
  return captureAuthSession();
}

/**
 * Clear the session, but never one that replaced the caller's. Logout passes
 * the snapshot it captured before waiting for native cleanup, so a successor
 * login's tokens survive a late continuation.
 */
export function clearAuthTokens(expected?: AuthSessionSnapshot): boolean {
  if (expected && !isAuthSessionCurrent(expected)) return false;
  removeItem(REFRESH_TOKEN);
  removeItem(ACCESS_TOKEN);
  setItem(AUTH_TOKEN_GENERATION, createAuthId());
  // Publish the replacement owner last, after no credential remains.
  setItem(AUTH_SESSION_OWNER, createAuthId());
  return true;
}

/**
 * A 401 ends this login's credentials without replacing the login itself. The
 * owner stays, so a sign-out already waiting for native cleanup can still
 * finish; the new generation invalidates every exact credential attempt.
 */
export function invalidateAuthTokens(): void {
  setItem(AUTH_TOKEN_GENERATION, createAuthId());
  removeItem(ACCESS_TOKEN);
  removeItem(REFRESH_TOKEN);
}

/** Begin a login request and publish it as the newest attempt. */
export function beginAuthLogin(): AuthLoginAttempt {
  const ticket = createAuthId();
  setItem(AUTH_LOGIN_ATTEMPT, ticket);
  return { ...captureAuthSession(), ticket };
}

/**
 * Commit a successful login only if its attempt ID is still the last one
 * published and neither the owner nor the API instance changed meanwhile.
 */
export function commitAuthLogin(
  attempt: AuthLoginAttempt,
  accessToken: string,
  refreshToken?: string,
): AuthSessionSnapshot | null {
  if (attempt.ticket !== readAuthId(AUTH_LOGIN_ATTEMPT)) return null;
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
