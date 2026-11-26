import { withAuthLoginLock } from './auth-login-lock';
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
 * A login started by a user action. The ID last published in
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
  instanceURL?: string;
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

// The split-token release had no owner pointer. Its initial owner is implicit
// until an explicit login installs a pointer. It has a separate seed key so a
// second startup cannot overwrite credentials already rotated for this owner.
const LEGACY_OWNER = 'legacy';
const LEGACY_SEED_KEY = 'auth_legacy_seed';

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

/** An absent pointer leaves room for the initial, pre-upgrade login. */
function readOwner(): string | null {
  const value = getItem(AUTH_SESSION);
  if (value === null) return LEGACY_OWNER;
  return AUTH_ID.test(value) ? value : null;
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
      instanceURL: owner === LEGACY_OWNER ? parsed.instanceURL : undefined,
    };
  } catch {
    return null;
  }
}

function writeAuthRecord(record: AuthSessionRecord): void {
  setItem(recordKey(record.owner), JSON.stringify(record));
}

/** Read one owner's record directly, without following the shared pointer. */
function readAuthRecord(owner: string): AuthSessionRecord | null {
  const raw = getItem(recordKey(owner));
  const record = parseAuthRecord(
    raw ?? (owner === LEGACY_OWNER ? getItem(LEGACY_SEED_KEY) : null),
    owner,
  );
  if (owner === LEGACY_OWNER && record?.instanceURL !== getApiBaseUrl()) {
    return null;
  }
  return record;
}

/**
 * Remove exactly the record this caller wrote. A later generation of the same
 * owner (another rotation) or a successor's record must survive; only the
 * generation that lost ownership is removed.
 */
function scrubAuthRecord(record: AuthSessionRecord): void {
  const persisted = parseAuthRecord(
    getItem(recordKey(record.owner)),
    record.owner,
  );
  if (persisted?.generation === record.generation) {
    removeItem(recordKey(record.owner));
  }
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
    record: readAuthRecord(owner),
    revoked: false,
  };
}

function clearLegacyTokens(): void {
  removeItem(ACCESS_TOKEN);
  removeItem(REFRESH_TOKEN);
}

function canAdoptLegacySession(instanceURL: string): boolean {
  return (
    getItem(AUTH_SESSION) === null &&
    getItem(revokedKey(LEGACY_OWNER)) === null &&
    getItem(recordKey(LEGACY_OWNER)) === null &&
    getApiBaseUrl() === instanceURL
  );
}

/** Adopt a split-token session at startup, before authenticated work begins. */
export function migrateLegacyAuthSession(): void {
  const instanceURL = getApiBaseUrl();
  if (!canAdoptLegacySession(instanceURL)) return;
  const existingSeed = getItem(LEGACY_SEED_KEY);
  if (existingSeed !== null) {
    // Retry cleanup if the previous startup stopped after persisting the seed.
    if (
      parseAuthRecord(existingSeed, LEGACY_OWNER)?.instanceURL === instanceURL
    ) {
      clearLegacyTokens();
    }
    return;
  }
  const accessToken = getItem(ACCESS_TOKEN) || null;
  const refreshToken = getItem(REFRESH_TOKEN) || null;
  if (!accessToken && !refreshToken) return;
  // A tab can split our two reads as it removes the old keys. It must have
  // published its seed first, so check the seed after reading both keys.
  if (
    (getItem(ACCESS_TOKEN) || null) !== accessToken ||
    (getItem(REFRESH_TOKEN) || null) !== refreshToken ||
    !canAdoptLegacySession(instanceURL) ||
    getItem(LEGACY_SEED_KEY) !== null
  ) {
    return;
  }

  const seed: AuthSessionRecord = {
    owner: LEGACY_OWNER,
    generation: LEGACY_OWNER,
    accessToken,
    refreshToken,
    instanceURL,
  };
  const serialized = JSON.stringify(seed);
  try {
    setItem(LEGACY_SEED_KEY, serialized);
  } catch {
    // Quota can prevent a write while both copies are present. Leave the split
    // pair available for a later startup.
    return;
  }
  // Login, revocation and refresh each take precedence over this seed, even
  // if they happened between the eligibility check and the write above.
  if (!canAdoptLegacySession(instanceURL)) {
    if (getItem(LEGACY_SEED_KEY) === serialized) removeItem(LEGACY_SEED_KEY);
    return;
  }
  if (getItem(LEGACY_SEED_KEY) === serialized) clearLegacyTokens();
}

/**
 * Auth readers only consult the owner's record. Startup is the only code
 * allowed to adopt the old `access_token`/`refresh_token` keys.
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
    instanceURL: record.instanceURL ?? getApiBaseUrl(),
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
  removeItem(LEGACY_SEED_KEY);
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
  if (getApiBaseUrl() !== expected.instanceURL) return null;
  // Read the initiating owner's record directly. Following the pointer here
  // would let a successor's owner name this bearer.
  const record = readAuthRecord(expected.owner);
  if (!record || record.generation !== expected.generation) return null;
  if (getItem(revokedKey(expected.owner)) !== null) return null;
  if (readOwner() !== expected.owner) return null;

  const rotated: AuthSessionRecord = {
    ...record,
    generation: createAuthId(),
    accessToken,
    refreshToken: refreshToken ?? record.refreshToken,
  };
  writeAuthRecord(rotated);
  if (expected.owner === LEGACY_OWNER) removeItem(LEGACY_SEED_KEY);

  // The checks and the write are not atomic across tabs. If A signed out or B
  // committed while the write was paused, the record now holds a valid pair
  // that no reader may use. Remove exactly this generation; a later rotation
  // of the same owner or B's record is untouched.
  const persisted = readAuthRecord(expected.owner);
  const lostOwnership =
    getItem(revokedKey(expected.owner)) !== null ||
    readOwner() !== expected.owner ||
    getApiBaseUrl() !== expected.instanceURL;
  if (lostOwnership) {
    scrubAuthRecord(rotated);
    return null;
  }
  // Another rotation of the same owner wrote after ours while the write was
  // paused: its generation is newer, so this result is obsolete.
  if (persisted?.generation !== rotated.generation) return null;

  return {
    owner: rotated.owner,
    generation: rotated.generation,
    accessToken: rotated.accessToken,
    instanceURL: expected.instanceURL,
  };
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
  if (!owner) return false;
  const initialOwner = owner === LEGACY_OWNER;
  // A sign-out at the empty boundary must also fence a migration that had
  // already started but had yet to write its seed.
  if (
    expected &&
    owner !== expected.owner &&
    !(initialOwner && expected.owner === NO_SESSION_ID)
  ) {
    return false;
  }
  if (getItem(revokedKey(owner)) !== null) return false;

  const initialRecord = initialOwner ? readAuthRecord(owner) : null;
  setItem(revokedKey(owner), '1');
  clearLegacyTokens();
  if (initialOwner) {
    removeItem(LEGACY_SEED_KEY);
    if (!initialRecord) return false;
  }
  writeAuthRecord({
    owner,
    generation: createAuthId(),
    accessToken: null,
    refreshToken: null,
    instanceURL: initialRecord?.instanceURL,
  });
  return true;
}

/**
 * A 401 ends the exact credentials that the rejected request used, without
 * replacing the login itself. The owner stays current, so a sign-out already
 * waiting for native cleanup can still finish. A successor (or a newer
 * generation of the same owner) that committed meanwhile is never selected as
 * the target, because the request names the owner, generation and instance it
 * was sent with.
 */
export function invalidateAuthTokens(attempt: AuthAttempt): boolean {
  if (getApiBaseUrl() !== attempt.instanceURL) return false;
  const record = readAuthRecord(attempt.owner);
  if (
    !record ||
    record.generation !== attempt.generation ||
    record.accessToken !== attempt.accessToken
  ) {
    return false;
  }
  if (getItem(revokedKey(attempt.owner)) !== null) return false;
  if (readOwner() !== attempt.owner) return false;

  clearLegacyTokens();
  writeAuthRecord({
    ...record,
    generation: createAuthId(),
    accessToken: null,
    refreshToken: null,
  });
  if (attempt.owner === LEGACY_OWNER) removeItem(LEGACY_SEED_KEY);
  return true;
}

/** Begin a login request and publish it as the newest attempt. */
export function beginAuthLogin(): Promise<AuthLoginAttempt> {
  const starting = (async () => {
    const instanceURL = getApiBaseUrl();
    return withAuthLoginLock(() => {
      const session = captureAuthSession();
      if (instanceURL !== session.instanceURL) {
        throw new Error('The API instance changed before login started.');
      }
      const ticket = createAuthId();
      setItem(AUTH_LOGIN_ATTEMPT, ticket);
      return { ...session, ticket };
    });
  })();
  // Form validation can still be running when browser storage rejects. The
  // caller receives the original rejection when it is ready to await it.
  void starting.catch(() => undefined);
  return starting;
}

/**
 * Commit a successful login only if its attempt ID is still the last one
 * published and neither the owner nor the API instance changed meanwhile.
 */
export function commitAuthLogin(
  attempt: AuthLoginAttempt,
  accessToken: string,
  refreshToken?: string,
): Promise<AuthSessionSnapshot | null> {
  return withAuthLoginLock(() => {
    if (!isAuthLoginCurrent(attempt)) return null;
    return installAuthTokens(accessToken, refreshToken);
  });
}

/**
 * Before commit, compare the initiating session. After commit, compare the
 * session that login installed while still requiring the same login ticket.
 */
export function isAuthLoginCurrent(
  attempt: Pick<AuthLoginAttempt, 'ticket' | 'owner' | 'instanceURL'>,
  session: Pick<AuthSessionSnapshot, 'owner' | 'instanceURL'> = attempt,
): boolean {
  return (
    attempt.ticket === readAuthAttemptId() && isAuthSessionCurrent(session)
  );
}

function readAuthAttemptId(): string {
  const value = getItem(AUTH_LOGIN_ATTEMPT);
  return value && value.length > 0 ? value : NO_SESSION_ID;
}

/** True while a continuation still belongs to the same owner and instance. */
export function isAuthSessionCurrent(
  snapshot: Pick<AuthSessionSnapshot, 'owner' | 'instanceURL'>,
): boolean {
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
