import { ActivityReviewAPI } from '@/api/activity-review/activity-review.api';
import { useActivityReviewsQuery } from '@/api/activity-review/activity-review.hooks';
import { eventKeys } from '@/api/event/event.keys';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { getApiBaseUrl } from '@/utils/capacitor';
import { sportTypeLabelMap } from '@/utils/label-map/core/sport-type.label-map';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ActivityReviewSummary } from '@openathlete/shared';

const providerName = (provider: string) =>
  ({
    GARMIN_PERSONAL: 'Garmin Personal API',
    GARMIN: 'Garmin',
    STRAVA: 'Strava',
    APPLE_HEALTH: 'Apple Health',
  })[provider] ?? provider;

function Recording({ summary }: { summary: ActivityReviewSummary }) {
  const minutes =
    (Date.parse(summary.endDate) - Date.parse(summary.startDate)) / 60000;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt>{m.activity_review_start()}</dt>
      <dd>
        {new Date(summary.startDate).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </dd>
      <dt>{m.activity_review_sport()}</dt>
      <dd>{sportTypeLabelMap[summary.sport]}</dd>
      <dt>{m.activity_review_distance()}</dt>
      <dd>
        {(summary.distance / 1000).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}{' '}
        km
      </dd>
      <dt>{m.activity_review_duration()}</dt>
      <dd>
        {minutes.toLocaleString(undefined, { maximumFractionDigits: 1 })} min
      </dd>
    </dl>
  );
}

export function ActivityReviews({ userId }: { userId: number }) {
  const cache = useQueryClient();
  const reviews = useActivityReviewsQuery(userId);
  const apiBaseUrl = getApiBaseUrl();
  const mounted = useRef(true);
  const attempted = useRef(new Set<string>());
  const inFlight = useRef(0);
  const [generation, setGeneration] = useState(0);
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({});
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refresh = useCallback(
    () =>
      cache.invalidateQueries({
        queryKey: ['activity-reviews', apiBaseUrl, userId],
      }),
    [cache, apiBaseUrl, userId],
  );
  const prepare = useCallback(
    async (id: string) => {
      attempted.current.add(id);
      inFlight.current++;
      setLoadErrors((previous) => ({ ...previous, [id]: false }));
      try {
        for (let attempt = 0; ; attempt++) {
          try {
            await ActivityReviewAPI.prepare(id);
            break;
          } catch (error) {
            const status = isAxiosError(error)
              ? error.response?.status
              : undefined;
            const code = isAxiosError(error)
              ? error.response?.data?.message
              : undefined;
            if (
              attempt ||
              status === 401 ||
              status === 429 ||
              ['key_required', 'imports_disabled'].includes(code)
            )
              throw error;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        await refresh();
      } catch {
        if (mounted.current) {
          setLoadErrors((previous) => ({ ...previous, [id]: true }));
          void cache.invalidateQueries({
            queryKey: ['garmin-personal', userId],
          });
        }
      } finally {
        inFlight.current--;
        if (mounted.current) setGeneration((previous) => previous + 1);
      }
    },
    [refresh, cache, userId],
  );
  useEffect(() => {
    for (const item of reviews.data?.pages.flatMap((page) => page.items) ??
      []) {
      if (inFlight.current >= 2) break;
      if (
        !item.summary &&
        item.canLoadDetails &&
        !attempted.current.has(item.id)
      )
        void prepare(item.id);
    }
    // Attempt each legacy recording once per visit, with bounded parallelism. A failed item has its own retry.
  }, [reviews.data, generation, prepare]);
  const resolve = useMutation({
    mutationFn: ActivityReviewAPI.resolve,
    onSuccess: async (result) => {
      await refresh();
      void cache.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
      if (result.pending) toast.info(m.activity_review_processing());
    },
    onError: () => {
      toast.error(m.activity_review_failed());
      void refresh();
    },
  });
  const busy = resolve.isPending;
  const total = reviews.data?.pages[0]?.total;
  return (
    <section
      aria-label={m.activity_review_title()}
      className="mt-4 space-y-4 rounded-xl border bg-card p-4 shadow-sm md:p-6 ph-no-capture ph-mask"
      data-cs-mask="true"
    >
      <h2 className="font-semibold">
        {m.activity_review_title()}
        {total !== undefined ? ` (${total})` : ''}
      </h2>
      {reviews.isPending ? (
        <p>{m.activity_review_loading()}</p>
      ) : reviews.isError ? (
        <div role="alert">
          <p>{m.activity_review_failed()}</p>
          <Button variant="outline" onClick={() => void reviews.refetch()}>
            {m.activity_review_retry()}
          </Button>
        </div>
      ) : !total ? (
        <p>{m.activity_review_empty()}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {m.activity_review_help()}
          </p>
          {reviews
            .data!.pages.flatMap((page) => page.items)
            .map((item) => (
              <article
                key={item.id}
                className="space-y-3 rounded-lg border p-3"
              >
                <h3 className="font-medium">
                  {providerName(item.provider)} ·{' '}
                  {item.summary?.name ?? item.externalId}
                </h3>
                {item.summary ? (
                  <>
                    <p className="text-sm font-medium">
                      {m.activity_review_recording()}
                    </p>
                    <Recording summary={item.summary} />
                    {item.candidates.length ? (
                      item.candidates.map((candidate) => (
                        <div
                          key={candidate.eventActivityId}
                          className="space-y-2 rounded-md border p-3"
                        >
                          <p className="text-sm font-medium">
                            {m.activity_review_existing()}: {candidate.name}
                            {candidate.provider
                              ? ` (${providerName(candidate.provider)})`
                              : ''}
                          </p>
                          <Recording summary={candidate} />
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              resolve.mutate({
                                id: item.id,
                                revision: item.revision,
                                action: 'link',
                                eventActivityId: candidate.eventActivityId,
                              })
                            }
                          >
                            {m.activity_review_link()}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm">
                        {m.activity_review_no_candidates()}
                      </p>
                    )}
                  </>
                ) : !item.canLoadDetails ? (
                  <p>{m.activity_review_unavailable()}</p>
                ) : loadErrors[item.id] ? (
                  <div role="alert">
                    <p>{m.activity_review_details_failed()}</p>
                    <Button
                      variant="outline"
                      disabled={busy || inFlight.current >= 2}
                      onClick={() => void prepare(item.id)}
                    >
                      {m.activity_review_retry_details()}
                    </Button>
                  </div>
                ) : (
                  <p role="status">{m.activity_review_loading()}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={busy || !item.canImport || !item.summary}
                    onClick={() =>
                      resolve.mutate({
                        id: item.id,
                        revision: item.revision,
                        action: 'import',
                      })
                    }
                  >
                    {m.activity_review_import()}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      resolve.mutate({
                        id: item.id,
                        revision: item.revision,
                        action: 'ignore',
                      })
                    }
                  >
                    {m.activity_review_ignore()}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {m.activity_review_ignore_hint()}
                </p>
              </article>
            ))}
          {reviews.hasNextPage && (
            <Button
              variant="outline"
              disabled={reviews.isFetchingNextPage}
              onClick={() => void reviews.fetchNextPage()}
            >
              {m.activity_review_more()}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
