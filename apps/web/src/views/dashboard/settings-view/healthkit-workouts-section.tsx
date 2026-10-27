import { HealthWorkoutUploadError } from '@/api/activity/healthkit-workout-error';
import { sendHealthWorkouts } from '@/api/activity/healthkit-workout-import';
import { healthImportFailure } from '@/api/metric/health-import-session';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getApiBaseUrl } from '@/utils/capacitor';
import {
  type HealthWorkoutStatus,
  hasLocalHealthKit,
  localHealthKit,
} from '@/utils/healthkit';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { useHealthKitConsent } from '@/utils/use-healthkit-consent';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { SPORT_TYPE } from '@openathlete/shared';

import { SettingsSection } from './settings-section';

export function HealthKitWorkoutsSection() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const native = hasLocalHealthKit();
  const apiBaseURL = getApiBaseUrl();
  const accountID = user ? String(user.userId) : '';
  const [status, setStatus] = useState<HealthWorkoutStatus>();
  const [days, setDays] = useState(30);
  const [sensors, setSensors] = useState(true);
  const [route, setRoute] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const session = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const remembered = useHealthKitConsent(
    { apiBaseURL, accountID },
    'workouts',
    {
      historyDays: days,
      includeSensors: sensors,
      includeRoute: route,
    },
    native && !!accountID && !!status,
  );
  const consent = remembered.read;
  const sendConsent = remembered.upload;
  useEffect(() => {
    const current = ++session.current;
    const abort = new AbortController();
    controller.current = abort;
    setStatus(undefined);
    setError('');
    setResult('');
    setBusy(false);
    if (native && accountID) {
      localHealthKit
        .workoutStatus({ apiBaseURL, accountID })
        .then((value) => {
          if (session.current !== current) return;
          setStatus(value);
          if (value.selection) {
            setDays(value.selection.historyDays);
            setSensors(value.selection.includeSensors);
            setRoute(value.selection.includeRoute);
          }
        })
        .catch(() => {
          if (session.current === current) setError(m.healthkit_read_failed());
        });
    }
    return () => {
      session.current = current + 1;
      abort.abort();
    };
  }, [native, apiBaseURL, accountID]);
  if (!native || !user) return null;
  const matches =
    status?.selection?.historyDays === days &&
    status.selection.includeSensors === sensors &&
    status.selection.includeRoute === route;
  const clearResult = () => {
    setResult('');
  };
  const action = async (operation: () => Promise<HealthWorkoutStatus>) => {
    const current = session.current;
    setBusy(true);
    setError('');
    clearResult();
    try {
      const value = await operation();
      if (session.current === current) setStatus(value);
    } catch (reason) {
      if (session.current === current) {
        const code =
          reason && typeof reason === 'object' && 'code' in reason
            ? reason.code
            : '';
        setError(
          code === 'HEALTHKIT_LOCKED'
            ? m.healthkit_unlock()
            : code === 'HEALTHKIT_STORAGE_LIMIT'
              ? m.healthkit_storage_limit()
              : m.healthkit_read_failed(),
        );
      }
    } finally {
      if (session.current === current) setBusy(false);
    }
  };
  const send = async () => {
    if (
      !sendConsent ||
      !matches ||
      !status ||
      status.hasMore ||
      !controller.current
    )
      return;
    const current = session.current;
    setBusy(true);
    setError('');
    setResult('');
    try {
      const counts = await sendHealthWorkouts({
        binding: { apiBaseURL, accountID },
        consent: true,
        uuids: status.workouts.map((item) => item.uuid),
        isCurrent: () => session.current === current,
        signal: controller.current.signal,
      });
      if (session.current !== current) return;
      setResult(m.healthkit_workouts_sent(counts));
      await queryClient.invalidateQueries();
    } catch (reason) {
      if (session.current === current) {
        const failure =
          reason instanceof HealthWorkoutUploadError
            ? reason.reason
            : healthImportFailure(reason);
        const explanation =
          reason instanceof Error &&
          reason.message === 'HEALTH_WORKOUT_API_UNAVAILABLE'
            ? m.healthkit_workouts_api_pending()
            : failure === 'login'
              ? m.healthkit_upload_login()
              : failure === 'conflict'
                ? m.healthkit_upload_conflict()
                : failure === 'size'
                  ? m.healthkit_upload_size()
                  : failure === 'invalid'
                    ? m.healthkit_upload_invalid()
                    : reason instanceof Error &&
                        reason.message === 'HEALTHKIT_LOCKED'
                      ? m.healthkit_unlock()
                      : m.healthkit_workouts_send_failed();
        setError(
          reason instanceof HealthWorkoutUploadError
            ? `${explanation} ${m.healthkit_workouts_failure_reference({ count: reason.confirmed, reference: reason.reference })}`
            : explanation,
        );
      }
    } finally {
      if (session.current === current) setBusy(false);
    }
  };
  return (
    <SettingsSection
      title={m.healthkit_workouts_title()}
      description={m.healthkit_workouts_help()}
      contentClassName="space-y-4"
    >
      <p className="break-all text-sm text-muted-foreground">
        {m.healthkit_account({ server: apiBaseURL, account: accountID })}
      </p>
      {status?.available === false ? (
        <p>{m.healthkit_unavailable()}</p>
      ) : (
        <>
          <fieldset disabled={busy} className="space-y-2">
            <label className="flex min-h-11 items-center gap-3">
              {m.healthkit_history()}
              <select
                aria-label={m.healthkit_history()}
                value={days}
                className="rounded-md border bg-background p-2"
                onChange={(event) => {
                  setDays(Number(event.target.value));
                  clearResult();
                }}
              >
                {[7, 30, 90, 365].map((value) => (
                  <option key={value} value={value}>
                    {m.healthkit_days({ days: value })}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <Checkbox
                checked={sensors}
                onCheckedChange={(value) => {
                  setSensors(value === true);
                  clearResult();
                }}
              />
              {m.healthkit_workouts_sensors()}
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <Checkbox
                checked={route}
                onCheckedChange={(value) => {
                  setRoute(value === true);
                  clearResult();
                }}
              />
              {m.healthkit_workouts_route()}
            </label>
            <label className="flex min-h-11 items-start gap-2 text-sm">
              <Checkbox
                checked={consent}
                onCheckedChange={(value) =>
                  remembered.update({ read: value === true })
                }
              />
              {m.healthkit_workouts_read_consent()}
            </label>
          </fieldset>
          <Button
            disabled={busy || !consent || !status}
            isLoading={busy}
            onClick={() =>
              void action(() =>
                localHealthKit.readWorkouts({
                  apiBaseURL,
                  accountID,
                  historyDays: days,
                  includeSensors: sensors,
                  includeRoute: route,
                  localConsent: true,
                }),
              )
            }
          >
            {status?.hasMore && matches
              ? m.healthkit_continue()
              : m.healthkit_workouts_read()}
          </Button>
        </>
      )}
      <p className="text-sm text-muted-foreground">
        {m.healthkit_auto_remember()}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {status?.lastRead && (
        <div className="ph-no-capture ph-mask space-y-2" data-cs-mask="true">
          <p>{m.healthkit_workouts_count({ count: status.workouts.length })}</p>
          {status.hasMore && <p>{m.healthkit_more()}</p>}
          <ul className="space-y-2 text-sm">
            {status.workouts.slice(0, 10).map((item) => (
              <li key={item.uuid}>
                {new Date(item.start).toLocaleString()} ·{' '}
                {sportTypeLabelMap[item.sport as SPORT_TYPE] ?? m.sport_other()}{' '}
                · {Math.round(item.duration / 60)} min
              </li>
            ))}
          </ul>
        </div>
      )}
      {status?.lastRead && (
        <div className="space-y-3 rounded-md border p-3">
          <label className="flex min-h-11 items-start gap-2 text-sm">
            <Checkbox
              disabled={busy || !matches}
              checked={sendConsent}
              onCheckedChange={(value) =>
                remembered.update({ upload: value === true })
              }
            />
            {m.healthkit_workouts_send_consent({ server: apiBaseURL })}
          </label>
          <Button
            disabled={
              busy ||
              !sendConsent ||
              !matches ||
              status.hasMore ||
              !status.workouts.length
            }
            onClick={() => void send()}
          >
            {m.healthkit_workouts_send()}
          </Button>
          {result && (
            <p role="status" className="text-sm">
              {result}
            </p>
          )}
        </div>
      )}
      {status?.lastRead && (
        <div className="space-y-2 rounded-md border p-3">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <Checkbox
              checked={remembered.automatic}
              disabled={busy || !consent || !sendConsent || !matches}
              onCheckedChange={(value) =>
                remembered.update({ automatic: value === true })
              }
            />
            {m.healthkit_auto_enable()}
          </label>
          <p className="text-sm text-muted-foreground">
            {m.healthkit_auto_help()}
          </p>
          {remembered.lastSuccess && (
            <p className="text-sm">
              {m.healthkit_auto_last({
                date: new Date(remembered.lastSuccess).toLocaleString(),
              })}
            </p>
          )}
          {remembered.failure && (
            <p className="text-sm">{m.healthkit_auto_pending()}</p>
          )}
        </div>
      )}
      {(!!status?.workouts.length || !!error) && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            void action(() =>
              localHealthKit.clearWorkouts({ apiBaseURL, accountID }),
            )
          }
        >
          {m.healthkit_workouts_clear()}
        </Button>
      )}
    </SettingsSection>
  );
}
