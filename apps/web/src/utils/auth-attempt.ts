import { getApiBaseUrl } from './capacitor';
import {
  ACCESS_TOKEN,
  AUTH_LOGIN_ATTEMPT,
  AUTH_SESSION,
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
 * token can still be recognised after a same-owner refresh. The owner,
 * generation and both credentials live in one authoritative storage record:
 * a reader can never observe a new owner paired with another login's bearer.
 */
export type AuthSessionSnapshot = {
  /** Changes only when a login starts or ends, not when tokens rotate. */
  owner: string;
  /** Changes on every token install, rotation or invalidation. */
  generation: string;
  /** `null` for an unauthenticated bootstrap or an invalidated credential. */
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

type AuthSessionRecord = {
  owner: string;
  generation: string;
  accessToken: string | null;
  refreshToken: string | null;
};

/** The boundary before the first login or after storage was reset. */
const NO_SESSION_ID = 'none';
const NO_SESSION: AuthSessionRecord = {
  owner: NO_SESSION_ID,
  generation: NO_SESSION_ID,
  accessToken: null,
  refreshToken: null,
};

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

function parseAuthRecord(raw: string): AuthSessionRecord | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSessionRecord>;
    if (
      typeof parsed.owner !== 'string' ||
      typeof parsed.generation !== 'string' ||
      (parsed.accessToken !== null && typeof parsed.accessToken !== 'string') ||
      (parsed.refreshToken !== null && typeof parsed.refreshToken !== 'string')
    ) {
      return null;
    }
    return {
      owner: parsed.owner,
      generation: parsed.generation,
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch {
    return null;
  }
}

function writeAuthRecord(record: AuthSessionRecord): void {
  setItem(AUTH_SESSION, JSON.stringify(record));
}

function clearLegacyTokens(): void {
  removeItem(ACCESS_TOKEN);
  removeItem(REFRESH_TOKEN);
}

/**
 * The record is the only authority. Legacy `access_token`/`refresh_token`
 * keys are read once to migrate an existing install, then removed. A present
 * signed-out record wins over any lingering legacy token.
 */
function readAuthRecord(): AuthSessionRecord | null {
  const raw = getItem(AUTH_SESSION);
  if (raw !== null) {
    // A present but unusable record is signed out, never a reason to fall back
    // to the old token keys. Old keys are not an authority once a record exists.
    clearLegacyTokens();
    return parseAuthRecord(raw) ?? NO_SESSION;
  }

  const legacyAccess = getItem(ACCESS_TOKEN);
  const legacyRefresh = getItem(REFRESH_TOKEN);
  if (legacyAccess === null && legacyRefresh === null) return null;

  const migrated: AuthSessionRecord = {
    owner: createAuthId(),
    generation: createAuthId(),
    accessToken: legacyAccess,
    refreshToken: legacyRefresh,
  };
  writeAuthRecord(migrated);
  clearLegacyTokens();
  return migrated;
}

function currentRecord(): AuthSessionRecord {
  return readAuthRecord() ?? NO_SESSION;
}

export function authTokenGeneration(): string {
  return currentRecord().generation;
}

/** The authoritative stored bearer, without exposing the refresh token. */
export function storedAccessToken(): string | null {
  return currentRecord().accessToken;
}

/** The authoritative stored refresh token, used only by the refresh flow. */
export function storedRefreshToken(): string | null {
  return currentRecord().refreshToken;
}

/** Snapshot of the owner, token, instance and generation at this moment. */
export function captureAuthSession(): AuthSessionSnapshot {
  const record = currentRecord();
  return {
    owner: record.owner,
    generation: record.generation,
    accessToken: record.accessToken,
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
  // One write, so no context can see a new owner with the previous bearer.
  writeAuthRecord({
    owner: createAuthId(),
    generation: createAuthId(),
    accessToken,
    refreshToken: refreshToken ?? null,
  });
  clearLegacyTokens();
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
  if (!isAuthSessionCurrent(expected)) return null;
  const current = currentRecord();
  writeAuthRecord({
    owner: current.owner,
    generation: createAuthId(),
    accessToken,
    refreshToken: refreshToken ?? current.refreshToken,
  });
  clearLegacyTokens();
  return captureAuthSession();
}

/**
 * Clear the session, but never one that replaced the caller's. Logout passes
 * the snapshot it captured before waiting for native cleanup, so a successor
 * login's tokens survive a late continuation.
 */
export function clearAuthTokens(expected?: AuthSessionSnapshot): boolean {
  if (expected && !isAuthSessionCurrent(expected)) return false;
  writeAuthRecord({
    owner: createAuthId(),
    generation: createAuthId(),
    accessToken: null,
    refreshToken: null,
  });
  clearLegacyTokens();
  return true;
}

/**
 * A 401 ends this login's credentials without replacing the login itself. The
 * owner stays, so a sign-out already waiting for native cleanup can still
 * finish; the new generation invalidates every exact credential attempt.
 */
export function invalidateAuthTokens(): void {
  const current = currentRecord();
  writeAuthRecord({
    owner: current.owner,
    generation: createAuthId(),
    accessToken: null,
    refreshToken: null,
  });
  clearLegacyTokens();
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
  if (attempt.ticket !== readAuthAttemptId()) return null;
  if (attempt.owner !== currentRecord().owner) return null;
  if (attempt.instanceURL !== getApiBaseUrl()) return null;
  return installAuthTokens(accessToken, refreshToken);
}

function readAuthAttemptId(): string {
  const value = getItem(AUTH_LOGIN_ATTEMPT);
  return value && value.length > 0 ? value : NO_SESSION_ID;
}

/** True while a continuation still belongs to the same owner and instance. */
export function isAuthSessionCurrent(snapshot: AuthSessionSnapshot): boolean {
  return (
    currentRecord().owner === snapshot.owner &&
    getApiBaseUrl() === snapshot.instanceURL
  );
}

/** True only while this exact owner, token and generation are installed. */
export function isAuthAttemptCurrent(attempt: AuthAttempt): boolean {
  const record = currentRecord();
  return (
    record.owner === attempt.owner &&
    getApiBaseUrl() === attempt.instanceURL &&
    record.generation === attempt.generation &&
    record.accessToken === attempt.accessToken
  );
}
