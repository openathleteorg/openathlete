import { registerPlugin } from '@capacitor/core';

import { getAccessToken } from './auth';
import { getApiBaseUrl, isIOS } from './capacitor';

/**
 * The native Apple Watch scheduling bridge. It is only registered on iOS; on
 * the web and Android `isAppleWatchScheduleAvailable()` is false and no entry
 * is shown, so the plugin is never called there.
 */
export type WatchScheduleScope = {
  instanceURL: string;
  athleteId: number;
};

export type WatchScheduleCredential = {
  accessToken: string;
  /** ISO 8601. Missing means the token cannot be used for background work. */
  expiresAt: string | null;
};

export type WatchSchedulePermission =
  'notDetermined' | 'denied' | 'authorized' | 'unsupported';

export type WatchScheduleTrigger =
  | 'connect'
  | 'launch'
  | 'resume'
  | 'calendar'
  | 'zones'
  | 'manual'
  | 'background';

export type WatchScheduleCounts = {
  scheduled: number;
  confirmed: number;
  unchanged: number;
  replaced: number;
  removed: number;
  completed: number;
  retained: number;
  overflow: number;
  failed: number;
};

export type WatchScheduleSkippedEvent = {
  eventId: number;
  startDate: string;
  /** Stable `ScheduleSkipReason.code`, translated by the settings section. */
  reasonCode: string;
  retryable: boolean;
};

export type WatchScheduleStatus = {
  enabled: boolean;
  hasOtherAccountOptIn: boolean;
  permission: WatchSchedulePermission;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastErrorCode: string | null;
  counts: WatchScheduleCounts;
  skipped: WatchScheduleSkippedEvent[];
  pendingCleanupEventIDs: number[];
  /** Submitted to Apple; presence is not confirmed. */
  unresolvedEventIDs: number[];
  /** Local/planning stage or a safe-to-retry removal. */
  localPendingEventIDs: number[];
  otherAccountPending: boolean;
  cleanupPending: boolean;
  cleanupUnknown: boolean;
};

export type WatchScheduleResult = {
  outcome: 'synced' | 'deferred' | 'failed';
  /** `WatchScheduleDeferral` when `outcome` is `deferred`. */
  deferral: string | null;
  /** Stable failure code when `outcome` is `failed`. */
  code: string | null;
  status: WatchScheduleStatus;
};

export type WatchScheduleDisconnectReport = {
  athleteId: number;
  instanceURL: string;
  removedEventIDs: number[];
  retainedEventIDs: number[];
  unresolvedEventIDs: number[];
  purgedCredential: boolean;
  permission: WatchSchedulePermission;
};

type WatchScheduleNativePlugin = {
  status(options: { scope: WatchScheduleScope }): Promise<WatchScheduleStatus>;
  connect(options: {
    scope: WatchScheduleScope;
    accessToken: string;
    expiresAt: string | null;
    requestPermission: boolean;
  }): Promise<WatchScheduleResult>;
  refresh(options: {
    scope: WatchScheduleScope;
    accessToken: string | null;
    expiresAt: string | null;
    trigger: WatchScheduleTrigger;
  }): Promise<WatchScheduleResult>;
  disconnect(options?: {
    scope?: WatchScheduleScope;
  }): Promise<WatchScheduleDisconnectReport | Record<string, never>>;
  fence(): Promise<void>;
  recover(): Promise<{ recovered: boolean }>;
};

const nativePlugin = registerPlugin<WatchScheduleNativePlugin>('WatchSchedule');

export function isAppleWatchScheduleAvailable(): boolean {
  return isIOS();
}

/** The account/instance identity used for credentials, receipts and cleanup. */
export function watchScheduleScope(athleteId: number): WatchScheduleScope {
  return rememberScope({
    instanceURL: getApiBaseUrl(),
    athleteId,
  });
}

/**
 * A foreground token for the native pass. The refresh token never crosses the
 * bridge: the app session renews it and hands over only the current access
 * token, with its expiry when the JWT has one.
 */
export async function watchScheduleCredential(): Promise<WatchScheduleCredential | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return {
    accessToken: token.accessToken,
    expiresAt: jwtExpiry(token.accessToken),
  };
}

function jwtExpiry(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: unknown };
    if (typeof decoded.exp !== 'number') return null;
    return new Date(decoded.exp * 1000).toISOString();
  } catch {
    return null;
  }
}

export async function getWatchScheduleStatus(
  scope: WatchScheduleScope,
): Promise<WatchScheduleStatus> {
  return nativePlugin.status({ scope });
}

export async function connectWatchSchedule(
  scope: WatchScheduleScope,
  credential: WatchScheduleCredential,
  requestPermission = true,
): Promise<WatchScheduleResult> {
  return nativePlugin.connect({
    scope,
    accessToken: credential.accessToken,
    expiresAt: credential.expiresAt,
    requestPermission,
  });
}

export async function refreshWatchSchedule(
  scope: WatchScheduleScope,
  credential: WatchScheduleCredential | null,
  trigger: WatchScheduleTrigger,
): Promise<WatchScheduleResult> {
  return nativePlugin.refresh({
    scope,
    accessToken: credential?.accessToken ?? null,
    expiresAt: credential?.expiresAt ?? null,
    trigger,
  });
}

/** With no scope, the native side uses the exact stored opt-in scope. */
export async function disconnectWatchSchedule(
  scope?: WatchScheduleScope,
): Promise<WatchScheduleDisconnectReport | null> {
  if (!isAppleWatchScheduleAvailable()) return null;
  const report = await nativePlugin.disconnect(scope ? { scope } : undefined);
  if (!report || !('athleteId' in report)) return null;
  return report as WatchScheduleDisconnectReport;
}

const FENCE_ACK_TIMEOUT_MS = 1500;
const FENCE_UNCONFIRMED_KEY = 'watch_schedule_fence_unconfirmed';

export type WatchScheduleFenceOperation = 'fence' | 'disconnect';

export type WatchScheduleUnconfirmedExit = {
  /** Identifies this exact exit attempt, never a reused scope/operation pair. */
  attemptId: string;
  /** The account whose retrieval never acknowledged, when it was known. */
  scope: WatchScheduleScope | null;
  operation: WatchScheduleFenceOperation;
};

const EXIT_ATTEMPT_NONCE = Math.random().toString(36).slice(2, 10);
let exitAttemptSerial = 0;
/**
 * The newest exit attempt this tab started. It intentionally outlives the
 * latch and the stored marker: after a successor signs in and clears storage,
 * a late callback from an older exit still must not recreate its marker.
 */
let latestExitAttemptId: string | null = null;

function nextExitAttemptId(boundary: number | null): string {
  if (boundary !== null) return `${EXIT_ATTEMPT_NONCE}:b${boundary}`;
  exitAttemptSerial += 1;
  return `${EXIT_ATTEMPT_NONCE}:n${exitAttemptSerial.toString(36)}`;
}

/** The validated account a marker may safely act on, or null when unknown. */
function markerScope(value: unknown): WatchScheduleScope | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<WatchScheduleScope>;
  if (
    typeof candidate.instanceURL !== 'string' ||
    !Number.isSafeInteger(candidate.athleteId) ||
    (candidate.athleteId ?? 0) <= 0
  ) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(candidate.instanceURL);
  } catch {
    return null;
  }
  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return null;
  }
  return {
    instanceURL: candidate.instanceURL,
    athleteId: candidate.athleteId as number,
  };
}

/**
 * The last account this tab actually used for watch scheduling. Logout needs
 * it to mark a missed acknowledgement with the original scope, so a later
 * retry cannot fence whichever account signs in next.
 */
let activeScope: WatchScheduleScope | null = null;

function rememberScope(scope: WatchScheduleScope): WatchScheduleScope {
  activeScope = scope;
  return scope;
}

export function watchScheduleActiveScope(): WatchScheduleScope | null {
  return activeScope;
}

export function forgetWatchScheduleScope(): void {
  activeScope = null;
}

/**
 * Synchronous marker for the signed-in web session. Logout and instance
 * switches bump it before their first await, so a settings or automatic action
 * that resolves later cannot call the bridge against a newer native epoch.
 */
let sessionEpoch = 0;
/**
 * Set before a logout or switch waits for the native fence. While it is set,
 * both old and new continuations are refused: an old access token is still in
 * storage during that wait, so bumping the epoch alone would let newly started
 * work pass. It is cleared only when an authenticated successor is established
 * (or a failed switch safely resumes the same session).
 */
let exitLatchedAt: number | null = null;

export function watchScheduleSessionEpoch(): number {
  return sessionEpoch;
}

export function isWatchScheduleSessionCurrent(epoch: number): boolean {
  return exitLatchedAt === null && epoch === sessionEpoch;
}

export function isWatchScheduleExitLatched(): boolean {
  return exitLatchedAt !== null;
}

/** The latch a caller observed when it started; `null` means none. */
export function watchScheduleExitBoundary(): number | null {
  return exitLatchedAt;
}

/**
 * Start a logout or instance switch. Call synchronously, before any await.
 * Returns a boundary token for `releaseWatchScheduleExit` when the attempt is
 * cancelled without clearing storage.
 */
export function latchWatchScheduleExit(): number {
  sessionEpoch += 1;
  exitLatchedAt = sessionEpoch;
  latestExitAttemptId = nextExitAttemptId(exitLatchedAt);
  return sessionEpoch;
}

/**
 * A switch was refused and the same session continues. Any work started during
 * the attempt is dropped by the epoch bump.
 */
export function releaseWatchScheduleExit(boundary: number): void {
  if (exitLatchedAt !== boundary) return;
  exitLatchedAt = null;
  sessionEpoch += 1;
}

/**
 * A newly authenticated session exists. The caller passes the exit boundary it
 * observed when it started authenticating: if a newer logout/switch latched in
 * the meantime, this result is stale and must not release that newer exit.
 */
export function establishWatchScheduleSession(
  observedExitBoundary: number | null = exitLatchedAt,
): boolean {
  if (observedExitBoundary !== exitLatchedAt) return false;
  sessionEpoch += 1;
  exitLatchedAt = null;
  return true;
}

export function invalidateWatchScheduleSession(): void {
  sessionEpoch += 1;
}

/**
 * Waits for the native fence acknowledgement. Returns true only when the
 * native bridge confirmed that writes and stored credentials are revoked.
 * A timeout or rejection is **not** an acknowledgement: logout may still
 * escape, but the caller must surface that scheduling was not confirmed off.
 */
export async function fenceWatchScheduleOnExit(): Promise<boolean> {
  invalidateWatchScheduleSession();
  if (!isAppleWatchScheduleAvailable()) return true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      nativePlugin.fence(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('watch_schedule_fence_timeout')),
          FENCE_ACK_TIMEOUT_MS,
        );
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Persisted only in session storage, and cleared when a later fence succeeds. */
export function markFenceUnconfirmed(
  scope: WatchScheduleScope | null = activeScope,
  operation: WatchScheduleFenceOperation = 'fence',
  boundary: number | null = exitLatchedAt,
): WatchScheduleUnconfirmedExit | null {
  // An explicit boundary only belongs to that exit. The latest attempt is
  // tracked independently of the latch and of session storage, so a successor
  // that already signed in and cleared the marker still fences off a late
  // callback from the older exit.
  if (boundary !== null) {
    const attemptId = nextExitAttemptId(boundary);
    if (latestExitAttemptId !== attemptId) return null;
    // A still-latched newer exit owns the marker. A finished exit (no latch)
    // may only rewrite its own marker, never one recorded by another attempt.
    if (exitLatchedAt !== null && boundary !== exitLatchedAt) return null;
    const current = readFenceUnconfirmed();
    if (exitLatchedAt === null && current && current.attemptId !== attemptId) {
      return null;
    }
  }
  const marker: WatchScheduleUnconfirmedExit = {
    attemptId: nextExitAttemptId(boundary),
    scope,
    operation,
  };
  try {
    sessionStorage.setItem(FENCE_UNCONFIRMED_KEY, JSON.stringify(marker));
    if (boundary === null) latestExitAttemptId = marker.attemptId;
    return marker;
  } catch {
    // Storage disabled: the settings warning degrades, sign-out still works.
    return null;
  }
}

export function readFenceUnconfirmed(): WatchScheduleUnconfirmedExit | null {
  try {
    const raw = sessionStorage.getItem(FENCE_UNCONFIRMED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WatchScheduleUnconfirmedExit>;
    const operation: WatchScheduleFenceOperation =
      parsed.operation === 'disconnect' ? 'disconnect' : 'fence';
    return {
      attemptId:
        typeof parsed.attemptId === 'string' && parsed.attemptId.length > 0
          ? parsed.attemptId
          : 'legacy',
      scope: markerScope(parsed.scope),
      operation,
    };
  } catch {
    // Unknown or legacy marker: never turn it into a global fence.
    return { attemptId: 'legacy', scope: null, operation: 'fence' };
  }
}

export function hasFenceUnconfirmed(): boolean {
  try {
    return sessionStorage.getItem(FENCE_UNCONFIRMED_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Clears only the marker this caller proved resolved. The per-exit attempt ID
 * is authoritative: an older continuation cannot erase a successor's marker
 * even when both describe the same scope and operation.
 */
export function clearFenceUnconfirmed(
  expected?: WatchScheduleUnconfirmedExit,
): boolean {
  const current = readFenceUnconfirmed();
  if (!current) return true;
  if (
    expected &&
    (current.attemptId !== expected.attemptId ||
      current.scope?.instanceURL !== expected.scope?.instanceURL ||
      current.scope?.athleteId !== expected.scope?.athleteId ||
      current.operation !== expected.operation)
  ) {
    return false;
  }
  try {
    sessionStorage.removeItem(FENCE_UNCONFIRMED_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-effort cleanup after the fence acknowledgement: the next launch reports
 * and retries any cleanup Apple did not confirm. It only ever addresses the
 * captured original scope; it never sends an unscoped disconnect that could
 * retire whichever account signed in next.
 */
export function disconnectWatchScheduleOnExit(
  scope: WatchScheduleScope | null = activeScope,
): Promise<WatchScheduleDisconnectReport | null> {
  invalidateWatchScheduleSession();
  if (!isAppleWatchScheduleAvailable()) {
    return Promise.resolve(null);
  }
  if (!scope) {
    // A cold exit has no JS scope. Durable teardown already authorized by the
    // fence is the only cleanup that may run; never send `disconnect()` with no
    // scope, because native would take that as a global teardown.
    return recoverWatchScheduleCleanup().then(() => null);
  }
  return disconnectWatchSchedule(scope).catch(() => null);
}

/**
 * Retries existing durable teardown only. Unlike `disconnect`, it never uses an
 * opt-in as cleanup authorization and never clears the session. A foreign
 * opt-in is left for an explicit `connect` of the current account, which
 * persists its own cleanup authorization before replacing it.
 */
export async function recoverWatchScheduleCleanup(): Promise<boolean> {
  if (!isAppleWatchScheduleAvailable()) return true;
  try {
    const result = await nativePlugin.recover();
    return result.recovered === true;
  } catch {
    return false;
  }
}

/**
 * Retries a delayed exit against the exact account and operation saved in its
 * marker, never against whichever account is displayed now. A known account is
 * retired only by its own scoped disconnect; an unknown one may only recover
 * teardown that was already authorized. Neither path may become a global fence
 * that would retire the currently signed-in account. The marker survives every
 * unacknowledged or superseded outcome.
 */
export async function retryWatchScheduleUnconfirmedExit(): Promise<boolean> {
  const marker = readFenceUnconfirmed();
  if (!marker) return true;
  if (!isAppleWatchScheduleAvailable()) return false;
  try {
    if (!marker.scope) {
      // Durable teardown only; no scoped retirement is authorized. A successful
      // recovery of an empty list is a no-op, not proof that an unknown exit
      // retired its opt-in, so the warning stays until a stronger proof exists.
      const recovered = await recoverWatchScheduleCleanup();
      return recovered;
    }
    // Scoped only. A nil report means this account is not the current opt-in;
    // that is not permission to touch the account that is.
    await disconnectWatchSchedule(marker.scope);
    if (!(await recoverWatchScheduleCleanup())) return false;
    // Positive proof for the saved scope only. The current account's status is
    // neither read nor replaced by this retry.
    const proof = await getWatchScheduleStatus(marker.scope);
    if (proof.enabled || proof.cleanupPending || proof.cleanupUnknown) {
      return false;
    }
    return clearFenceUnconfirmed(marker);
  } catch {
    return false;
  }
}
