import { useGetMyAthleteQuery } from '@/api/athlete';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import {
  type WatchScheduleResult,
  type WatchScheduleSkippedEvent,
  type WatchScheduleStatus,
  clearFenceUnconfirmed,
  connectWatchSchedule,
  disconnectWatchSchedule,
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
import { RefreshCw, RotateCcw, Watch } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from './settings-section';

/** Stable `ScheduleSkipReason.code` / `UnsupportedReason` groups. */
function skipReasonMessage(code: string): string {
  switch (code) {
    case 'poolSwimmingUnverified':
      return m.apple_watch_skip_pool();
    case 'detailUnavailable':
    case 'zonesUnavailable':
      return m.apple_watch_skip_retry();
    case 'foreignEvent':
      return m.apple_watch_skip_foreign_event();
    case 'unsupportedSport':
      return m.apple_watch_skip_sport();
    case 'zoneIdMissing':
    case 'zoneNotFound':
    case 'zoneOwnerMismatch':
    case 'zoneSportMismatch':
    case 'zoneTypeMismatch':
    case 'missingZoneBounds':
    case 'invalidZoneBounds':
      return m.apple_watch_skip_zone();
    case 'multipleTargets':
    case 'unsupportedTarget':
    case 'relativeTarget':
    case 'ambiguousRelativeTarget':
    case 'missingTargetValue':
    case 'invalidTargetValue':
      return m.apple_watch_skip_target();
    case 'unsupportedStepType':
    case 'repeatWithoutBlock':
    case 'stepStructureMismatch':
    case 'misplacedWarmupCooldown':
    case 'nestedRepeats':
    case 'unsupportedRepeatKind':
    case 'invalidRepetitions':
    case 'emptyRepeat':
    case 'unsupportedDurationType':
    case 'invalidDurationValue':
    case 'missingAthlete':
    case 'noExecutableSteps':
      return m.apple_watch_skip_structure();
    default:
      return m.apple_watch_skip_other();
  }
}

function skippedSummary(skipped: WatchScheduleSkippedEvent[]): string[] {
  const seen = new Set<string>();
  const messages: string[] = [];
  for (const event of skipped) {
    const text = skipReasonMessage(event.reasonCode);
    if (seen.has(text)) continue;
    seen.add(text);
    messages.push(text);
  }
  return messages;
}

function formatLastSuccess(value: string | null): string {
  if (!value) return m.apple_watch_never_refreshed();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return m.apple_watch_never_refreshed();
  return m.apple_watch_last_success({
    date: date.toLocaleString(),
  });
}

function isAuthDeferral(outcome: WatchScheduleResult): boolean {
  return (
    outcome.outcome === 'deferred' &&
    (outcome.deferral === 'credentialRequired' ||
      outcome.deferral === 'credentialExpired')
  );
}

/**
 * The iPhone setting for scheduling planned sessions in Apple's Workout app.
 * It renders nothing on the web or Android, and on iPads where WorkoutKit is
 * unsupported it explains why. A successful call here only means the iPhone
 * handed the plan to Apple: it never claims delivery to the watch.
 */
export function AppleWatchScheduleSection() {
  // The athlete query stays off the web and Android: the inner component only
  // mounts where the native bridge exists.
  if (!isAppleWatchScheduleAvailable()) return null;
  return <AppleWatchScheduleSectionIOS />;
}

function AppleWatchScheduleSectionIOS() {
  const { data: athlete, isLoading: athleteLoading } = useGetMyAthleteQuery();
  const athleteId = athlete?.athleteId;

  const [status, setStatus] = useState<WatchScheduleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<
    'connect' | 'refresh' | 'disconnect' | 'recover' | null
  >(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [failure, setFailure] = useState<
    'unavailable' | 'expired' | 'cleanup' | null
  >(null);
  const [fenceUnconfirmed, setFenceUnconfirmed] = useState(
    hasFenceUnconfirmed(),
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const instanceURL = athleteId
    ? watchScheduleScope(athleteId).instanceURL
    : null;

  const loadStatus = useCallback(async () => {
    if (!athleteId || !instanceURL) return;
    const session = watchScheduleSessionEpoch();
    if (isWatchScheduleExitLatched()) return;
    try {
      const next = await getWatchScheduleStatus({
        instanceURL,
        athleteId,
      });
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setStatus(next);
      }
    } catch {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setFailure('unavailable');
      }
    }
  }, [athleteId, instanceURL]);

  useEffect(() => {
    if (!athleteId || !instanceURL) return;
    let cancelled = false;
    const session = watchScheduleSessionEpoch();
    const currentScope = { instanceURL, athleteId };
    setLoading(true);
    const load = async () => {
      try {
        if (isWatchScheduleExitLatched()) {
          if (!cancelled) setLoading(false);
          return;
        }
        const next = await getWatchScheduleStatus(currentScope);
        if (
          cancelled ||
          !mounted.current ||
          isWatchScheduleExitLatched() ||
          !isWatchScheduleSessionCurrent(session)
        ) {
          return;
        }
        // Unknown state dominates: knowing cleanup is unknown is not
        // authorization to disconnect or recover. The row below offers the
        // dedicated retry.
        if (next.cleanupUnknown) {
          setStatus(next);
        } else if (next.hasOtherAccountOptIn || next.cleanupPending) {
          // A foreign opt-in and existing durable teardown are both recovered
          // through the dedicated path, never by disconnecting this account.
          setStatus(next);
          const recovered = await recoverWatchScheduleCleanup(currentScope);
          if (
            cancelled ||
            !mounted.current ||
            isWatchScheduleExitLatched() ||
            !isWatchScheduleSessionCurrent(session)
          ) {
            return;
          }
          if (!recovered) {
            // Keep the readable status and the retry row; do not infer success.
            setFailure('cleanup');
            return;
          }
          const current = await getWatchScheduleStatus(currentScope);
          if (
            cancelled ||
            !mounted.current ||
            isWatchScheduleExitLatched() ||
            !isWatchScheduleSessionCurrent(session)
          ) {
            return;
          }
          setStatus(current);
        } else {
          setStatus(next);
        }
      } catch {
        if (
          !cancelled &&
          mounted.current &&
          isWatchScheduleSessionCurrent(session)
        ) {
          setFailure('unavailable');
        }
      } finally {
        if (
          !cancelled &&
          mounted.current &&
          isWatchScheduleSessionCurrent(session)
        ) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [athleteId, instanceURL]);

  if (athleteLoading || loading) {
    return (
      <SettingsSection title={m.apple_watch_scheduling()}>
        <SettingsRowsSkeleton count={1} />
      </SettingsSection>
    );
  }

  if (!athleteId || !instanceURL || !status) return null;

  const scope = { instanceURL, athleteId };

  const applyResult = async (result: WatchScheduleResult) => {
    if (mounted.current) {
      setStatus(result.status);
      setFailure(
        isAuthDeferral(result)
          ? 'expired'
          : result.outcome === 'failed'
            ? 'unavailable'
            : null,
      );
    }
  };

  const connect = async () => {
    if (!scope || busy) return;
    const session = watchScheduleSessionEpoch();
    setBusy('connect');
    setFailure(null);
    try {
      const credential = await watchScheduleCredential();
      if (!isWatchScheduleSessionCurrent(session)) return;
      if (!credential) {
        setFailure('expired');
        return;
      }
      const result = await connectWatchSchedule(scope, credential);
      if (!isWatchScheduleSessionCurrent(session)) return;
      await applyResult(result);
      if (result.outcome === 'synced') {
        toast.success(m.apple_watch_refreshed());
      }
    } catch {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setFailure('unavailable');
      }
      if (isWatchScheduleSessionCurrent(session)) {
        toast.error(m.apple_watch_refresh_failed());
      }
    } finally {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setBusy(null);
      }
    }
  };

  const refresh = async () => {
    if (!scope || busy) return;
    const session = watchScheduleSessionEpoch();
    setBusy('refresh');
    setFailure(null);
    try {
      const credential = await watchScheduleCredential();
      if (!isWatchScheduleSessionCurrent(session)) return;
      if (!credential) {
        setFailure('expired');
        return;
      }
      const result = await refreshWatchSchedule(scope, credential, 'manual');
      if (!isWatchScheduleSessionCurrent(session)) return;
      await applyResult(result);
      if (result.outcome === 'synced') {
        toast.success(m.apple_watch_refreshed());
      }
    } catch {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setFailure('unavailable');
      }
      if (isWatchScheduleSessionCurrent(session)) {
        toast.error(m.apple_watch_refresh_failed());
      }
    } finally {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setBusy(null);
      }
    }
  };

  const disconnect = async () => {
    if (!scope || busy) return;
    const session = watchScheduleSessionEpoch();
    setBusy('disconnect');
    try {
      const report = await disconnectWatchSchedule(scope);
      if (!isWatchScheduleSessionCurrent(session)) return;
      setConfirmDisconnect(false);
      if (
        report &&
        (!report.purgedCredential ||
          report.retainedEventIDs.length > 0 ||
          report.unresolvedEventIDs.length > 0)
      ) {
        setFailure('cleanup');
      }
      await loadStatus();
    } catch {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setFailure('unavailable');
      }
      if (isWatchScheduleSessionCurrent(session)) {
        toast.error(m.apple_watch_refresh_failed());
      }
    } finally {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setBusy(null);
      }
    }
  };

  const retryCleanup = async () => {
    if (!scope || busy) return;
    const session = watchScheduleSessionEpoch();
    setBusy('recover');
    setFailure(null);
    try {
      const recovered = await recoverWatchScheduleCleanup(scope);
      if (!isWatchScheduleSessionCurrent(session)) return;
      if (!recovered) {
        setFailure('cleanup');
        return;
      }
      await loadStatus();
    } catch {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setFailure('unavailable');
      }
    } finally {
      if (mounted.current && isWatchScheduleSessionCurrent(session)) {
        setBusy(null);
      }
    }
  };

  const skipped = skippedSummary(status.skipped);
  const enabled = status.enabled;
  const permissionDenied =
    status.permission === 'denied' || status.permission === 'unsupported';
  const unsupported = status.permission === 'unsupported';
  const needsPermission = enabled && status.permission === 'notDetermined';

  return (
    <SettingsSection
      title={m.apple_watch_scheduling()}
      description={m.apple_watch_scheduling_description()}
    >
      <SettingsPanel>
        <SettingsRow
          leading={<Watch className="size-4" />}
          title={
            enabled ? m.apple_watch_connected() : m.apple_watch_not_connected()
          }
          description={
            enabled ? formatLastSuccess(status.lastSuccessAt) : undefined
          }
        >
          {enabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={busy !== null || permissionDenied}
            >
              <RefreshCw
                className={
                  busy === 'refresh' ? 'size-4 animate-spin' : 'size-4'
                }
              />
              {busy === 'refresh'
                ? m.apple_watch_refreshing()
                : m.apple_watch_refresh()}
            </Button>
          ) : permissionDenied ? null : (
            <Button
              size="sm"
              onClick={() => void connect()}
              disabled={busy !== null}
            >
              {m.apple_watch_enable()}
            </Button>
          )}
        </SettingsRow>

        {unsupported && (
          <SettingsRow
            stacked
            title={m.apple_watch_unsupported_device()}
            description={m.apple_watch_unsupported_device_hint()}
          />
        )}

        {!unsupported && permissionDenied && (
          <SettingsRow
            stacked
            title={m.apple_watch_permission_denied_title()}
            description={m.apple_watch_permission_denied()}
          />
        )}

        {needsPermission && (
          <SettingsRow
            stacked
            title={m.apple_watch_permission_needed_title()}
            description={m.apple_watch_permission_needed()}
          />
        )}

        {failure === 'expired' && (
          <SettingsRow stacked description={m.apple_watch_sign_in_again()} />
        )}

        {failure === 'cleanup' && (
          <SettingsRow
            stacked
            description={m.apple_watch_cleanup_incomplete()}
          />
        )}

        {(status.cleanupUnknown ||
          status.cleanupPending ||
          status.hasOtherAccountOptIn) && (
          <SettingsRow
            stacked
            description={
              status.cleanupUnknown
                ? m.apple_watch_cleanup_unknown()
                : m.apple_watch_cleanup_incomplete()
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => void retryCleanup()}
              disabled={busy !== null}
            >
              <RotateCcw
                className={
                  busy === 'recover' ? 'size-4 animate-spin' : 'size-4'
                }
              />
              {busy === 'recover'
                ? m.apple_watch_refreshing()
                : m.apple_watch_cleanup_retry()}
            </Button>
          </SettingsRow>
        )}

        {fenceUnconfirmed && (
          <SettingsRow stacked description={m.apple_watch_fence_unconfirmed()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void fenceWatchScheduleOnExit().then((acknowledged) => {
                  if (!acknowledged) return;
                  clearFenceUnconfirmed();
                  setFenceUnconfirmed(false);
                });
              }}
            >
              {m.apple_watch_refresh()}
            </Button>
          </SettingsRow>
        )}

        {failure === 'unavailable' && status.lastErrorCode && (
          <SettingsRow stacked description={m.apple_watch_error_refresh()} />
        )}

        {status.unresolvedEventIDs.length > 0 && (
          <SettingsRow
            stacked
            description={m.apple_watch_unresolved_write({
              count: status.unresolvedEventIDs.length,
            })}
          />
        )}

        {status.localPendingEventIDs.length > 0 && (
          <SettingsRow
            stacked
            description={m.apple_watch_local_pending({
              count: status.localPendingEventIDs.length,
            })}
          />
        )}

        {status.lastErrorCode === 'journalUnavailable' && (
          <SettingsRow stacked description={m.apple_watch_error_refresh()} />
        )}

        {status.pendingCleanupEventIDs.length > 0 && (
          <SettingsRow
            stacked
            description={m.apple_watch_pending_cleanup({
              count: status.pendingCleanupEventIDs.length,
            })}
          />
        )}

        {status.otherAccountPending && (
          <SettingsRow
            stacked
            description={m.apple_watch_other_account_pending()}
          />
        )}

        {status.counts.overflow > 0 && (
          <SettingsRow
            stacked
            description={m.apple_watch_overflow_count({
              count: status.counts.overflow,
            })}
          />
        )}

        {skipped.length > 0 && (
          <SettingsRow
            stacked
            title={m.apple_watch_skipped_title({
              count: status.skipped.length,
            })}
            description={
              <ul className="list-disc space-y-1 pl-4">
                {skipped.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            }
          />
        )}

        <SettingsRow stacked description={m.apple_watch_pool_notice()} />

        {enabled && (
          <SettingsRow>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDisconnect(true)}
              disabled={busy !== null}
            >
              <RotateCcw className="size-4" />
              {m.apple_watch_disconnect()}
            </Button>
          </SettingsRow>
        )}
      </SettingsPanel>

      <ConfirmAction
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={() => void disconnect()}
        title={m.apple_watch_disconnect_title()}
        message={m.apple_watch_disconnect_message()}
        isLoading={busy === 'disconnect'}
      />
    </SettingsSection>
  );
}
