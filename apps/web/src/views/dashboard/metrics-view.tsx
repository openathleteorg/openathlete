import { useGetLatestMetricsQuery, useGetMetricsQuery } from '@/api/metric';
import { InjuryLogsTable } from '@/components/metrics/injury-logs-table';
import { MetricDetail } from '@/components/metrics/metric-detail';
import { MetricList } from '@/components/metrics/metric-list';
import { MetricQuickEntry } from '@/components/metrics/metric-quick-entry';
import { usePinnedMetrics } from '@/components/metrics/use-pinned-metrics';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PageTitle } from '@/components/ui/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSetPageActions } from '@/hooks/use-page-actions';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';
import { subDays } from 'date-fns';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { METRIC_TYPE } from '@openathlete/shared';

/** Enough for the 60 values of a baseline, without years of daily data */
const LIST_WINDOW_DAYS = 120;

interface P {
  athleteId?: number;
}

export function MetricsView({ athleteId }: P) {
  const isMobile = useIsMobile();
  const [chosen, setChosen] = useState<METRIC_TYPE | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);

  const from = useMemo(
    () => subDays(new Date(), LIST_WINDOW_DAYS).toISOString().slice(0, 10),
    [],
  );
  const { data: latest = {}, isPending: isLoadingLatest } =
    useGetLatestMetricsQuery(athleteId);
  const { data: metrics = [], isPending: isLoadingMetrics } =
    useGetMetricsQuery(undefined, athleteId, from);
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });
  const {
    pinned,
    togglePinned,
    isPending: isLoadingPinned,
  } = usePinnedMetrics(athleteId ?? 0);

  const firstPinnedWithData = pinned.find((type) => latest[type]);
  const firstWithData = Object.keys(latest)[0] as METRIC_TYPE | undefined;
  const selected =
    chosen ?? firstPinnedWithData ?? firstWithData ?? pinned[0] ?? null;

  const handleSelect = (type: METRIC_TYPE) => {
    setChosen(type);
    setIsDetailOpen(true);
  };

  const openQuickEntry = useCallback(() => setIsQuickEntryOpen(true), []);
  const actions = useMemo(
    () => [
      { label: m.metrics_enter_values(), icon: Plus, onClick: openQuickEntry },
    ],
    [openQuickEntry],
  );
  useSetPageActions(actions);

  const pageTitle = isCurrentUser
    ? m.my_metrics()
    : m.metrics_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  const detail = selected && (
    <MetricDetail
      // Each metric starts on its own range and with an empty form
      key={selected}
      type={selected}
      pinned={pinned.includes(selected)}
      onTogglePinned={() => togglePinned(selected)}
      athleteId={athleteId}
    />
  );

  return (
    <div className="w-full space-y-5 p-4 md:p-8">
      <div className="flex items-center justify-between gap-2">
        <PageTitle desktopOnly>{pageTitle}</PageTitle>
        <Button onClick={openQuickEntry} className="hidden md:flex">
          <Plus className="mr-2 h-4 w-4" />
          {m.metrics_enter_values()}
        </Button>
      </div>

      <Tabs defaultValue="tracking" className="gap-4">
        <TabsList>
          <TabsTrigger value="tracking">{m.metrics_tab_tracking()}</TabsTrigger>
          <TabsTrigger value="injuries">{m.injury_logs()}</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking">
          {isLoadingLatest || isLoadingMetrics || isLoadingPinned ? (
            <div className="space-y-2 lg:max-w-sm">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-8">
              <MetricList
                metrics={metrics}
                latest={latest}
                pinned={pinned}
                selected={isMobile ? null : selected}
                onSelect={handleSelect}
              />
              {!isMobile && detail}
            </div>
          )}
        </TabsContent>

        <TabsContent value="injuries">
          <InjuryLogsTable athleteId={athleteId} />
        </TabsContent>
      </Tabs>

      {isMobile && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent mobileFullscreen>
            <DialogTitle>
              {selected ? metricTypeLabelMap[selected] : m.metrics()}
            </DialogTitle>
            {detail}
          </DialogContent>
        </Dialog>
      )}

      <MetricQuickEntry
        open={isQuickEntryOpen}
        onOpenChange={setIsQuickEntryOpen}
        latest={latest}
        athleteId={athleteId}
      />
    </div>
  );
}
