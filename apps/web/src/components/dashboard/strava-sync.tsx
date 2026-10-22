import { eventKeys } from '@/api/event/event.keys';
import { type ConnectedProvider } from '@/api/provider/provider.api';
import {
  useStravaSyncStatusQuery,
  useSyncStravaMutation,
} from '@/api/provider/provider.hooks';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function restoreSync(key: string): string | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (typeof value?.id === 'string' && Date.now() - value.at < 24 * 3600_000)
      return value.id;
  } catch {
    /* Storage can be disabled; syncing still works. */
  }
}

export function StravaSync({
  provider,
  scope,
}: {
  provider?: ConnectedProvider;
  scope: string;
}) {
  const storageKey = `strava-sync:${scope}`;
  const sync = useSyncStravaMutation();
  const [syncId, setSyncId] = useState(() => restoreSync(storageKey));
  const progress = useStravaSyncStatusQuery(
    scope,
    provider ? syncId : undefined,
  );
  const queryClient = useQueryClient();
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    if (!requested) return;
    const timer = window.setTimeout(() => setRequested(false), 60_000);
    return () => window.clearTimeout(timer);
  }, [requested]);
  useEffect(() => {
    if (sync.data) {
      setRequested(true);
      setSyncId(sync.data.syncId);
      try {
        if (sync.data.syncId)
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({ id: sync.data.syncId, at: Date.now() }),
          );
        else sessionStorage.removeItem(storageKey);
      } catch {
        /* Storage is optional. */
      }
    }
  }, [sync.data, storageKey]);
  const result = progress.data;
  useEffect(() => {
    if (
      !result ||
      !['completed', 'failed'].includes(result.state) ||
      !result.imported
    )
      return;
    for (const key of [
      eventKeys.getMyEvents,
      eventKeys.getEvent,
      eventKeys.getSeasonEvents,
    ])
      void queryClient.invalidateQueries({ queryKey: [key] });
  }, [result, queryClient]);
  if (!provider) return null;
  const ready =
    provider.status === 'active' && provider.importActivitiesEnabled;
  const tracking =
    !!syncId && (!result || ['queued', 'running'].includes(result.state));
  const busy = sync.isPending || (tracking && !progress.error);
  const status = isAxiosError(sync.error)
    ? sync.error.response?.status
    : undefined;
  const error =
    status === 404 || status === 501
      ? m.sync_strava_unavailable()
      : status === 429
        ? m.sync_strava_wait()
        : m.sync_source_failed();
  return (
    <section
      className="mt-5 space-y-3 border-t pt-4 ph-no-capture ph-mask"
      data-cs-mask="true"
      aria-label="Strava"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Strava</h2>
        <Button
          className="min-h-11"
          disabled={!ready || busy || requested}
          onClick={() => sync.mutate()}
        >
          <RefreshCw className={busy ? 'size-4 animate-spin' : 'size-4'} />
          {busy ? m.sync_source_progress() : m.sync_strava_now()}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{m.sync_strava_help()}</p>
      {!ready && (
        <Link
          className="inline-flex min-h-11 items-center underline"
          to="/dashboard/settings?tab=connectors"
        >
          {m.sync_strava_connection()}
        </Link>
      )}
      <div role="status" aria-live="polite" className="space-y-1 text-sm">
        {busy && (
          <p>
            {result?.retrying
              ? m.sync_strava_retrying()
              : m.sync_strava_running()}
          </p>
        )}
        {result && !progress.error && !sync.isPending && (
          <>
            {result.imported > 0 && (
              <p>{m.sync_strava_imported({ count: result.imported })}</p>
            )}
            {result.state === 'completed' && !result.total && (
              <p>{m.sync_strava_no_new()}</p>
            )}
            {result.needsReview > 0 && (
              <p>{m.sync_strava_review({ count: result.needsReview })}</p>
            )}
            {result.state === 'unavailable' && (
              <p>{m.sync_strava_status_unavailable()}</p>
            )}
          </>
        )}
        {sync.isSuccess && !syncId && <p>{m.sync_strava_queued()}</p>}
      </div>
      {(sync.error || progress.error || result?.state === 'failed') && (
        <p role="alert" className="text-sm text-destructive">
          {sync.error
            ? error
            : progress.error
              ? m.sync_strava_status_unavailable()
              : result?.failed
                ? m.sync_strava_import_failed({ count: result.failed })
                : m.sync_strava_failed()}
        </p>
      )}
    </section>
  );
}
