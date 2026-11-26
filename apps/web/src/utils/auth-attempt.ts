import { getApiBaseUrl } from './capacitor';
import {
  ACCESS_TOKEN,
  AUTH_LOGIN_ATTEMPT,
  AUTH_RECORD_PREFIX,
  AUTH_REVOKED_PREFIX,
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
 * token can still be recognised after a same-owner refresh. The owner is the
 * only value in the shared key; each owner's credentials live in its own
 * record, so a late write can never be labelled with another login's owner.
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

type AuthAuthority = {
  /** The login named by the shared pointer, even if it signed out. */
  owner: string;
  /** Its credential record, or null when absent/unreadable/revoked. */
  record: AuthSessionRecord | null;
  revoked: boolean;
};

/** The boundary before the first login or after storage was reset. */
const NO_SESSION_ID = 'none';
const NO_SESSION: AuthSessionRecord = {
  owner: NO_SESSION_ID,
  generation: NO_SESSION_ID,
  accessToken: null,
  refreshToken: null,
};

// Opaque IDs only. The old single-record format stored JSON here, which this
// pattern rejects, so a mixed-version tab reads it as signed out rather than
// as an owner.
const AUTH_ID = /^[A-Za-z0-9_-]{8,64}$/;

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

function recordKey(owner: string): string {
  return `${AUTH_RECORD_PREFIX}${owner}`;
}

function revokedKey(owner: string): string {
  return `${AUTH_REVOKED_PREFIX}${owner}`;
}

/** Read the shared pointer once. It names an owner, never a credential. */
function readOwner(): string | null {
  const value = getItem(AUTH_SESSION);
  return value !== null && AUTH_ID.test(value) ? value : null;
}

function parseAuthRecord(
  raw: string | null,
  owner: string,
): AuthSessionRecord | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSessionRecord>;
    if (
      parsed.owner !== owner ||
      typeof parsed.generation !== 'string' ||
      (parsed.accessToken !== null && typeof parsed.accessToken !== 'string') ||
      (parsed.refreshToken !== null && typeof parsed.refreshToken !== 'string')
    ) {
      return null;
    }
    return {
      owner,
      generation: parsed.generation,
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch {
    return null;
  }
}

function writeAuthRecord(record: AuthSessionRecord): void {
  setItem(recordKey(record.owner), JSON.stringify(record));
}

/**
 * Read the pointer and the record it names, without ever adopting a record
 * that belongs to another owner. Revocation is per owner, so a stale refresh
 * that writes after a sign-out cannot revive the session.
 */
function readAuthority(): AuthAuthority | null {
  const owner = readOwner();
  if (!owner) return null;
  if (getItem(revokedKey(owner)) !== null) {
    return { owner, record: null, revoked: true };
  }
  return {
    owner,
    record: parseAuthRecord(getItem(recordKey(owner)), owner),
    revoked: false,
  };
}

function clearLegacyTokens(): void {
  removeItem(ACCESS_TOKEN);
  removeItem(REFRESH_TOKEN);
}

/**
 * The record is the only authority. A pointer without a readable record, a
 * revoked owner and any unknown format are all signed out. Legacy
 * `access_token`/`refresh_token` keys are never read: adopting them would
 * require a write during a read, which can land after another tab signs out.
 */
function currentRecord(): AuthSessionRecord {
  const authority = readAuthority();
  if (!authority || authority.revoked || !authority.record) return NO_SESSION;
  return authority.record;
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
  const owner = createAuthId();
  // The credential record exists before the pointer names it, so a reader can
  // never follow the new owner to a missing record.
  writeAuthRecord({
    owner,
    generation: createAuthId(),
    accessToken,
    refreshToken: refreshToken ?? null,
  });
  const previousOwner = readOwner();
  setItem(AUTH_SESSION, owner);
  clearLegacyTokens();
  // The pointer no longer names the previous owner. Its record can go, along
  // with its sign-out tombstone; a stale refresh may recreate the record, but
  // the pointer already names this login, so it stays unreachable.
  if (previousOwner && previousOwner !== owner) {
    removeItem(recordKey(previousOwner));
    removeItem(revokedKey(previousOwner));
  }
  return captureAuthSession();
}

/**
 * Rotate the credential of the session that started the refresh. A refresh is
 * not a new owner: same-owner continuations stay current, while a successor
 * login makes this return null. The write is addressed to the initiating
 * owner and never to the shared pointer, so a successor's login cannot be
 * replaced even when it commits between our read and our write.
 */
export function rotateAuthTokens(
  expected: AuthSessionSnapshot,
  accessToken: string,
  refreshToken?: string,
): AuthSessionSnapshot | null {
  const authority = readAuthority();
  if (!authority || authority.revoked || !authority.record) return null;
  if (authority.owner !== expected.owner) return null;
  // Bind the exact credential, not only the owner: another rotation or a
  // sign-out that finished while the network call ran wins over this result.
  if (authority.record.generation !== expected.generation) return null;

  writeAuthRecord({
    owner: expected.owner,
    generation: createAuthId(),
    accessToken,
    refreshToken: refreshToken ?? authority.record.refreshToken,
  });
  if (!isAuthSessionCurrent(expected)) return null;
  // A successor may have committed between that check and this read.
  const snapshot = captureAuthSession();
  return snapshot.owner === expected.owner ? snapshot : null;
}

/**
 * Clear the session, but never one that replaced the caller's. Logout passes
 * the snapshot it captured before waiting for native cleanup, so a successor
 * login's tokens survive a late continuation. The revocation tombstone is
 * written first: a refresh that was already in flight can write its rotated
 * credential afterwards, but readers still treat this owner as signed out.
 */
export function clearAuthTokens(expected?: AuthSessionSnapshot): boolean {
  const owner = readOwner();
  clearLegacyTokens();
  if (!owner) return false;
  if (expected && owner !== expected.owner) return false;
  if (getItem(revokedKey(owner)) !== null) return false;

  const generation = createAuthId();
  setItem(revokedKey(owner), '1');
  writeAuthRecord({
    owner,
    generation,
    accessToken: null,
    refreshToken: null,
  });
  return true;
}

/**
 * A 401 ends this login's credentials without replacing the login itself. The
 * owner stays current, so a sign-out already waiting for native cleanup can
 * still finish; the new generation invalidates every exact credential attempt.
 */
export function invalidateAuthTokens(): void {
  const authority = readAuthority();
  clearLegacyTokens();
  if (!authority || authority.revoked || !authority.record) return;
  // Addressed to the owner we read. A successor that commits meanwhile owns
  // the pointer and another record, so this write cannot reach it.
  writeAuthRecord({
    owner: authority.owner,
    generation: createAuthId(),
    accessToken: null,
    refreshToken: null,
  });
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
