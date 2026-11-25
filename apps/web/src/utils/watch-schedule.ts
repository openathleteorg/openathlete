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
};

const nativePlugin = registerPlugin<WatchScheduleNativePlugin>('WatchSchedule');

export function isAppleWatchScheduleAvailable(): boolean {
  return isIOS();
}

/** The account/instance identity used for credentials, receipts and cleanup. */
export function watchScheduleScope(athleteId: number): WatchScheduleScope {
  return { instanceURL: getApiBaseUrl(), athleteId };
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

/**
 * Waits for the native fence acknowledgement before the app clears auth state.
 * The native epoch takes effect synchronously and this does not wait for Apple
 * reads or removals; cleanup continues after the acknowledgement. A timeout
 * prevents a stuck bridge from blocking sign-out.
 */
export async function fenceWatchScheduleOnExit(): Promise<void> {
  if (!isAppleWatchScheduleAvailable()) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      nativePlugin.fence(),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, FENCE_ACK_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // The next launch reports any cleanup Apple did not confirm.
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Best-effort cleanup after the fence acknowledgement: the next launch reports
 * and retries any cleanup Apple did not confirm.
 */
export function disconnectWatchScheduleOnExit(): void {
  if (!isAppleWatchScheduleAvailable()) return;
  void disconnectWatchSchedule().catch(() => undefined);
}
