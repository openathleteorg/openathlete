import { HealthWorkoutUploadError } from '@/api/activity/healthkit-workout-error';
import { useInstanceInfoQuery } from '@/api/instance';
import { healthImportFailure } from '@/api/metric/health-import-session';
import { useGetConnectedProvidersQuery } from '@/api/provider/provider.hooks';
import { ImportFitDialog } from '@/components/import-fit-dialog/import-fit-dialog';
import { Button } from '@/components/ui/button';
import { ZwiftSync } from '@/components/zwift/zwift-sync';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getApiBaseUrl } from '@/utils/capacitor';
import {
  type HealthSyncKind,
  type HealthSyncOverview,
  hasLocalHealthKit,
  localHealthKit,
} from '@/utils/healthkit';
import { syncApprovedHealth } from '@/utils/healthkit-manual-sync';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { ActivityReviews } from './activity-reviews';
import { GarminPersonalSync } from './garmin-personal-sync';
import { StravaSync } from './strava-sync';

const kinds: HealthSyncKind[] = ['workouts', 'measurements'];
const connections = '/dashboard/settings?tab=connectors';

function failureText(error: unknown) {
  const reason =
    error instanceof HealthWorkoutUploadError
      ? error.reason
      : healthImportFailure(error);
  const code =
    error && typeof error === 'object' && 'code' in error
      ? error.code
      : error instanceof Error
        ? error.message
        : '';
  if (code === 'HEALTHKIT_LOCKED') return m.healthkit_unlock();
  if (code === 'HEALTH_SYNC_BUSY') return m.sync_source_busy();
  if (code === 'HEALTH_IMPORT_NOT_AUTHORIZED') return m.sync_health_setup();
  if (reason === 'login') return m.healthkit_upload_login();
  if (reason === 'conflict') return m.healthkit_upload_conflict();
  if (reason === 'size') return m.healthkit_upload_size();
  if (reason === 'invalid') return m.healthkit_upload_invalid();
  return m.sync_source_failed();
}

/** Data actions for the athlete's dedicated sync and import page. */
export function SyncPanel() {
  const { user } = useAuthContext();
  const { data: instance } = useInstanceInfoQuery();
  const native = hasLocalHealthKit();
  const apiBaseURL = getApiBaseUrl();
  const accountID = user ? String(user.userId) : '';
  const key = `${apiBaseURL}|${accountID}`;
  const { data: providers } = useGetConnectedProvidersQuery();
  const queryClient = useQueryClient();
  const session = useRef(0);
  const running = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [state, setState] = useState<{
    key: string;
    overview?: HealthSyncOverview;
    busy?: boolean;
    messages: Partial<Record<HealthSyncKind, string>>;
    error?: string;
  }>({ key, messages: {} });
  const current =
    state.key === key
      ? state
      : {
          key,
          overview: undefined,
          busy: false,
          messages: {} as Partial<Record<HealthSyncKind, string>>,
          error: undefined,
        };

  useEffect(() => {
    const version = ++session.current;
    const abort = new AbortController();
    controller.current = abort;
    running.current = false;
    setState({ key, messages: {} });
    const load = async () => {
      if (!native || !accountID || running.current) return;
      try {
        const overview = await localHealthKit.syncOverview({
          apiBaseURL,
          accountID,
        });
        if (session.current === version)
          setState((previous) => ({
            ...previous,
            key,
            overview,
            error: undefined,
          }));
      } catch {
        if (session.current === version)
          setState((previous) => ({
            ...previous,
            key,
            error: m.sync_source_failed(),
          }));
      }
    };
    void load();
    window.addEventListener('focus', load);
    const timer = window.setInterval(load, 15_000);
    return () => {
      session.current = version + 1;
      abort.abort();
      window.removeEventListener('focus', load);
      window.clearInterval(timer);
    };
  }, [key, native, apiBaseURL, accountID]);

  const ready = kinds.filter(
    (kind) =>
      current.overview?.[kind]?.read && current.overview?.[kind]?.upload,
  );
  const sync = async () => {
    if (running.current || !controller.current || !ready.length) return;
    running.current = true;
    const version = session.current;
    const signal = controller.current.signal;
    const isCurrent = () => session.current === version;
    setState((previous) => ({
      ...previous,
      busy: true,
      messages: {},
      error: undefined,
    }));
    for (const kind of ready) {
      if (!isCurrent()) break;
      setState((previous) => ({
        ...previous,
        messages: { ...previous.messages, [kind]: m.sync_source_progress() },
      }));
      try {
        const result = await syncApprovedHealth({
          binding: { apiBaseURL, accountID },
          kind,
          signal,
          isCurrent,
        });
        if (!isCurrent()) break;
        const message = !result.complete
          ? m.sync_source_incomplete()
          : !result.count
            ? m.healthkit_no_readable_data()
            : m.sync_source_done({
                count: result.count,
                date: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              });
        setState((previous) => ({
          ...previous,
          messages: { ...previous.messages, [kind]: message },
        }));
      } catch (error) {
        if (!isCurrent()) break;
        const detail =
          error instanceof HealthWorkoutUploadError
            ? ` ${m.healthkit_workouts_failure_reference({ count: error.confirmed, reference: error.reference })}`
            : '';
        setState((previous) => ({
          ...previous,
          messages: {
            ...previous.messages,
            [kind]: failureText(error) + detail,
          },
        }));
      }
    }
    if (isCurrent()) {
      running.current = false;
      setState((previous) => ({ ...previous, busy: false }));
      void queryClient.invalidateQueries();
    }
  };
  const strava = providers?.find((provider) => provider.provider === 'STRAVA');
  return (
    <section
      aria-label={m.sync_panel_title()}
      data-sync-panel
      className="rounded-xl border bg-card p-4 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold md:text-2xl">
            {m.sync_panel_title()}
          </h1>
          <Link
            to={connections}
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            {m.sync_manage_connections()}
          </Link>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {native && (
            <Button
              className="min-h-11 flex-1 sm:flex-none"
              disabled={current.busy || current.overview?.busy || !ready.length}
              onClick={() => void sync()}
            >
              <RefreshCw
                className={
                  current.busy || current.overview?.busy
                    ? 'size-4 animate-spin'
                    : 'size-4'
                }
              />
              {current.busy || current.overview?.busy
                ? m.sync_source_progress()
                : m.sync_health_now()}
            </Button>
          )}
          <ImportFitDialog triggerLabel={m.sync_import_file()} />
        </div>
      </div>
      <div
        aria-live="polite"
        className="ph-no-capture ph-mask space-y-2 text-sm"
        data-cs-mask="true"
      >
        {native && current.overview && !ready.length && (
          <p className="text-muted-foreground">{m.sync_health_setup()}</p>
        )}
        {kinds
          .filter((kind) => current.overview?.[kind])
          .map((kind) => (
            <div
              key={kind}
              className="flex flex-wrap justify-between gap-x-3 gap-y-1"
            >
              <span>
                {kind === 'workouts'
                  ? m.sync_health_workouts()
                  : m.sync_health_measurements()}
              </span>
              <span className="text-muted-foreground">
                {current.messages[kind] ??
                  (ready.includes(kind)
                    ? current.overview?.busy
                      ? m.sync_source_progress()
                      : m.sync_source_ready()
                    : m.sync_source_permission())}
              </span>
            </div>
          ))}
        {current.error && (
          <p role="alert" className="text-destructive">
            {current.error}
          </p>
        )}
      </div>
      {user && instance?.activityReview && (
        <ActivityReviews key={key} userId={user.userId} />
      )}
      <StravaSync
        key={key}
        scope={key}
        provider={strava}
        userId={user?.userId}
      />
      <GarminPersonalSync />
      <ZwiftSync />
    </section>
  );
}
