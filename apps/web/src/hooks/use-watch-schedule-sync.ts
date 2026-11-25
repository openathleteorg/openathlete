import { useGetMyAthleteQuery } from '@/api/athlete';
import { eventKeys } from '@/api/event/event.keys';
import { trainingZoneKeys } from '@/api/training-zone/training-zone.keys';
import { useAuthContext } from '@/contexts/auth';
import { queryClient } from '@/utils/query-client';
import {
  type WatchScheduleScope,
  type WatchScheduleTrigger,
  clearFenceUnconfirmed,
  fenceWatchScheduleOnExit,
  getWatchScheduleStatus,
  hasFenceUnconfirmed,
  isAppleWatchScheduleAvailable,
  isWatchScheduleExitLatched,
  isWatchScheduleSessionCurrent,
  recoverWatchScheduleCleanup,
  refreshWatchSchedule,
  watchScheduleCredential,
  watchScheduleScope,
  watchScheduleSessionEpoch,
} from '@/utils/watch-schedule';
import { App } from '@capacitor/app';
import { useEffect, useMemo, useRef } from 'react';

const REFRESH_DEBOUNCE_MS = 1500;

function isRelevantInvalidation(
  key: readonly unknown[],
): WatchScheduleTrigger | null {
  const root = key[0];
  if (typeof root !== 'string') return null;
  // The athlete's own calendar, including coach-authored sessions: the native
  // snapshot reads `GET /event` without the coach view.
  if (root.startsWith(eventKeys.root)) return 'calendar';
  if (root.startsWith(trainingZoneKeys.root)) return 'zones';
  return null;
}

function swallowConnectionError() {
  // A failed refresh is reported by the native status model, not an unhandled
  // rejection: the next foreground trigger retries.
}

async function runPass(
  scope: WatchScheduleScope,
  trigger: WatchScheduleTrigger,
) {
  const session = watchScheduleSessionEpoch();
  if (!isWatchScheduleSessionCurrent(session)) return;
  const credential = await watchScheduleCredential();
  // A logout while the token was being read must not call the bridge against
  // the new native epoch.
  if (!isWatchScheduleSessionCurrent(session)) return;
  await refreshWatchSchedule(scope, credential, trigger);
}

/**
 * Keeps Apple's schedule current while the app is signed in on iPhone:
 * launch/resume and invalidations of the athlete's own calendar or training
 * zones. The opt-in itself is explicit in the settings section; this hook never
 * enables scheduling, and does nothing on the web or Android.
 */
export function useWatchScheduleSync() {
  const { authenticated } = useAuthContext();
  const available = isAppleWatchScheduleAvailable();
  const { data: athlete } = useGetMyAthleteQuery();
  const athleteId = athlete?.athleteId;
  const scope = useMemo(
    () => (athleteId ? watchScheduleScope(athleteId) : null),
    [athleteId],
  );
  const latestScope = useRef<WatchScheduleScope | null>(null);
  latestScope.current = scope;

  // Launch: clean a previous account's opt-in before touching this one, then
  // refresh only when this athlete had already enabled scheduling.
  useEffect(() => {
    if (!available || !authenticated || !scope) return;
    let cancelled = false;

    const launch = async () => {
      let session = watchScheduleSessionEpoch();
      if (!isWatchScheduleSessionCurrent(session)) return;
      if (hasFenceUnconfirmed()) {
        const beforeFence = session;
        const acknowledged = await fenceWatchScheduleOnExit();
        if (cancelled || isWatchScheduleExitLatched()) return;
        // The fence is a session boundary inside this authenticated session.
        // Accept only the boundary this call created; never adopt an arbitrary
        // newer epoch if a logout or another fence happened meanwhile.
        const afterFence = watchScheduleSessionEpoch();
        if (afterFence !== beforeFence + 1) return;
        if (!acknowledged) return;
        clearFenceUnconfirmed();
        session = afterFence;
      }
      const status = await getWatchScheduleStatus(scope);
      if (cancelled || !isWatchScheduleSessionCurrent(session)) return;
      // Unknown state dominates: it is not authorization to disconnect or
      // recover anything. The settings screen offers the dedicated retry.
      if (status.cleanupUnknown) return;
      if (status.cleanupPending) {
        // Only existing durable authorization is recovered. A foreign opt-in
        // is not cleanup permission; an explicit connect of this account
        // persists its own teardown authorization first.
        const recovered = await recoverWatchScheduleCleanup();
        if (cancelled || !isWatchScheduleSessionCurrent(session)) return;
        if (!recovered) return;
        const current = await getWatchScheduleStatus(scope);
        if (cancelled || !isWatchScheduleSessionCurrent(session)) return;
        if (!current.enabled) return;
        await runPass(scope, 'launch');
        return;
      }
      if (!status.enabled) return;
      await runPass(scope, 'launch');
    };

    void launch().catch(swallowConnectionError);
    return () => {
      cancelled = true;
    };
  }, [available, authenticated, scope]);

  // Resume from the background. Reading the latest scope from a ref keeps the
  // single native listener in sync with account changes.
  useEffect(() => {
    if (!available) return;
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      const current = latestScope.current;
      if (!isActive || !current) return;
      // Resume only needs the foreground token; the native opt-in decides
      // whether anything runs.
      void runPass(current, 'resume').catch(swallowConnectionError);
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [available]);

  // Own calendar and zone mutations invalidate their queries. Coalesce a burst
  // of invalidations into one pass; the native actor serializes the rest.
  useEffect(() => {
    if (!available || !scope) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pending: WatchScheduleTrigger | null = null;

    const flush = () => {
      timer = null;
      const trigger = pending;
      pending = null;
      const current = latestScope.current;
      if (!trigger || !current) return;
      void runPass(current, trigger).catch(swallowConnectionError);
    };

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!event.query.state.isInvalidated) return;
      const trigger = isRelevantInvalidation(event.query.queryKey);
      if (!trigger) return;
      pending = trigger;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, REFRESH_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [available, scope]);
}
