import {
  useCreateRecordExclusionMutation,
  useDeleteRecordExclusionMutation,
  useGetRecordExclusionsQuery,
  useGetRecordHistoryQuery,
  useGetRecordSportsQuery,
} from '@/api/record';
import { EventDetails } from '@/components/event-details/event-details';
import { RecordDetailDialog } from '@/components/records/record-detail-dialog';
import {
  allTimeRecords,
  headlinePositions,
  latestRecords,
  recordYears,
  recordsOfYear,
  suspectRecords,
} from '@/components/records/record-history';
import {
  RECORD_METRICS,
  RecordMetric,
  recordPosition,
} from '@/components/records/record-metrics';
import {
  LabelledSeries,
  RecordsCurveChart,
} from '@/components/records/records-curve-chart';
import {
  LatestRecordsCard,
  RecordExclusionsCard,
} from '@/components/records/records-side-cards';
import { RecordsSummary } from '@/components/records/records-summary';
import { RecordsYearsTable } from '@/components/records/records-years-table';
import { TrainingPacesCard } from '@/components/records/training-paces-card';
import { useDismissedSuspects } from '@/components/records/use-dismissed-suspects';
import { SportSelect } from '@/components/sport-select/sport-select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { InsightBanner } from '@/components/ui/insight-banner';
import { PageTitle } from '@/components/ui/page-title';
import { SkeletonChart } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  CreateRecordExclusionDto,
  RECORD_TYPE,
  SPORT_TYPE,
} from '@openathlete/shared';

interface P {
  athleteId?: number;
}

const YEAR_COLORS = [
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-3)',
  'var(--chart-6)',
  'var(--chart-7)',
];
const yearColor = (index: number) => YEAR_COLORS[index % YEAR_COLORS.length];

export function RecordsView({ athleteId }: P) {
  const { data: sports, isPending: isLoadingSports } =
    useGetRecordSportsQuery(athleteId);
  const [chosenSport, setChosenSport] = useState<SPORT_TYPE | null>(null);
  // One sport at a time: a run and a ride on the same curve mean nothing.
  // The athlete's most frequent sport comes first.
  const sport =
    chosenSport && sports?.includes(chosenSport)
      ? chosenSport
      : (sports?.[0] ?? null);
  const query = { sport: sport ?? undefined, athleteId };
  const { data: history, isPending: isLoadingHistory } =
    useGetRecordHistoryQuery(query);
  const { data: exclusions = [] } = useGetRecordExclusionsQuery(query);
  const createExclusion = useCreateRecordExclusionMutation();
  const deleteExclusion = useDeleteRecordExclusionMutation();

  const [metricType, setMetricType] = useState(RECORD_TYPE.SPEED);
  const [toggledYears, setToggledYears] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<{
    metric: RecordMetric;
    position: number;
  } | null>(null);
  const [openEventId, setOpenEventId] = useState<number | null>(null);
  const { dismissed, dismiss } = useDismissedSuspects(athleteId);
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });

  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(getDateLocale(getLocale()), {
        dateStyle: 'medium',
      }),
    [],
  );
  const pageTitle = isCurrentUser
    ? m.my_records()
    : m.records_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  const records = useMemo(
    () => (history ? allTimeRecords(history) : []),
    [history],
  );
  const years = useMemo(() => (history ? recordYears(history) : []), [history]);
  const suspects = useMemo(
    () =>
      suspectRecords(history?.podium ?? []).filter(
        (record) => !dismissed.includes(record.eventActivityId),
      ),
    [history, dismissed],
  );
  const metrics = RECORD_METRICS.filter((metric) =>
    records.some((record) => record.type === metric.type),
  );
  const metric =
    metrics.find((candidate) => candidate.type === metricType) ?? metrics[0];
  const positions = records
    .filter((record) => record.type === metric?.type)
    .map((record) => recordPosition(record) ?? 0)
    .sort((a, b) => a - b);

  const currentYear = new Date().getUTCFullYear();
  const seasonRecords = history ? recordsOfYear(history, currentYear) : [];
  // The two latest seasons say the most, until the athlete picks others
  const compared = toggledYears ?? years.slice(0, 2);
  const series: LabelledSeries[] = [
    {
      key: 'allTime',
      label: m.records_record(),
      color: 'var(--chart-1)',
      records,
    },
    ...years
      .map((year, index) => ({
        key: `y${year}`,
        label: `${year}`,
        color: yearColor(index),
        year,
      }))
      .filter(({ year }) => compared.includes(year))
      .map(({ year, ...rest }) => ({
        ...rest,
        records: history ? recordsOfYear(history, year) : [],
      })),
  ];

  const suspectActivities = [
    ...new Map(
      suspects.map((record) => [record.eventActivityId, record]),
    ).values(),
  ];

  const restore = (exclusionId: number) =>
    deleteExclusion.mutate(exclusionId, {
      onError: () => toast.error(m.records_exclusion_failed()),
    });
  const exclude = (exclusion: CreateRecordExclusionDto) =>
    createExclusion.mutate(exclusion, {
      onSuccess: ({ recordExclusionId }) =>
        toast.success(m.records_excluded(), {
          action: {
            label: m.cancel(),
            onClick: () => restore(recordExclusionId),
          },
        }),
      onError: () => toast.error(m.records_exclusion_failed()),
    });
  const openRecord = (next: RecordMetric, position: number) => {
    setMetricType(next.type);
    setSelected({ metric: next, position });
  };
  const toggleYear = (year: number) =>
    setToggledYears(
      compared.includes(year)
        ? compared.filter((other) => other !== year)
        : [...compared, year],
    );

  const isLoading = isLoadingSports || (sport !== null && isLoadingHistory);

  return (
    <div className="w-full p-4 md:p-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle desktopOnly>{pageTitle}</PageTitle>
        {sports && sports.length > 0 && (
          <SportSelect
            selected={sport}
            onChange={setChosenSport}
            sports={sports}
            allowAll={false}
          />
        )}
      </div>
      {isLoading ? (
        <SkeletonChart className="h-[400px]" />
      ) : sport === null || !metric ? (
        <>
          <Card>
            <CardContent>
              <p className="text-lg font-semibold">
                {m.no_records_found({ sport: '' })}
              </p>
            </CardContent>
          </Card>
          {/* Everything may be excluded: it must stay possible to restore it */}
          {sport !== null && exclusions.length > 0 && (
            <RecordExclusionsCard
              exclusions={exclusions}
              sport={sport}
              dateFormat={dateFormat}
              onRestore={(exclusion) => restore(exclusion.recordExclusionId)}
            />
          )}
        </>
      ) : (
        <>
          {suspectActivities.length > 0 && (
            <InsightBanner
              text={m.records_suspects_title({
                count: suspectActivities.length,
              })}
              source={m.records_suspects_text()}
              actions={[
                ...suspectActivities.map((record) => ({
                  label: `${record.activityName ?? ''} · ${dateFormat.format(new Date(record.date))}`,
                  onClick: () => {
                    const suspectMetric = RECORD_METRICS.find(
                      (candidate) => candidate.type === record.type,
                    );
                    const position = recordPosition(record);
                    if (suspectMetric && position !== null)
                      openRecord(suspectMetric, position);
                  },
                })),
                {
                  label: m.records_suspects_ignore(),
                  onClick: () =>
                    dismiss(suspects.map((record) => record.eventActivityId)),
                },
              ]}
            />
          )}
          <RecordsSummary
            metric={metric}
            sport={sport}
            positions={headlinePositions(metric, positions)}
            records={records}
            seasonRecords={seasonRecords}
            year={currentYear}
            dateFormat={dateFormat}
            onSelect={(position) => openRecord(metric, position)}
          />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem] gap-4 items-start">
            <Card
              data-records-metric={metric.type}
              className="min-w-0 gap-0 py-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3 md:px-4">
                <Tabs
                  value={metric.type}
                  onValueChange={(value) => setMetricType(value as RECORD_TYPE)}
                  className="max-w-full overflow-x-auto"
                >
                  <TabsList className="h-11 md:h-9">
                    {metrics.map((candidate) => (
                      <TabsTrigger key={candidate.type} value={candidate.type}>
                        {candidate.title(sport)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="flex max-w-full gap-1.5 overflow-x-auto">
                  {years.map((year, index) => {
                    const active = compared.includes(year);
                    return (
                      <button
                        key={year}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleYear(year)}
                        className={cn(
                          'flex min-h-11 md:min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-sm font-medium cursor-pointer',
                          !active && 'text-muted-foreground',
                        )}
                        style={
                          active ? { borderColor: yearColor(index) } : undefined
                        }
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'size-2 rounded-full',
                            !active && 'opacity-30',
                          )}
                          style={{ backgroundColor: yearColor(index) }}
                        />
                        {year}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="p-3 md:p-4">
                <RecordsCurveChart
                  metric={metric}
                  sport={sport}
                  series={series}
                  onSelect={(position) => openRecord(metric, position)}
                />
              </div>
              <RecordsYearsTable
                metric={metric}
                sport={sport}
                records={records}
                history={history?.years ?? []}
                years={years}
                suspects={suspects}
                dateFormat={dateFormat}
                onSelect={(position) => openRecord(metric, position)}
              />
              <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                {m.records_legend()}
              </p>
            </Card>
            <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
              {sport === SPORT_TYPE.RUNNING && (
                // This season says more of the current level than an old best
                <TrainingPacesCard recordSets={[seasonRecords, records]} />
              )}
              <LatestRecordsCard
                records={latestRecords(records, currentYear, suspects)}
                sport={sport}
                year={currentYear}
                dateFormat={dateFormat}
                onSelect={openRecord}
              />
              <RecordExclusionsCard
                exclusions={exclusions}
                sport={sport}
                dateFormat={dateFormat}
                onRestore={(exclusion) => restore(exclusion.recordExclusionId)}
              />
            </div>
          </div>
        </>
      )}
      {selected && sport && (
        <RecordDetailDialog
          key={`${selected.metric.type}:${selected.position}`}
          metric={selected.metric}
          sport={sport}
          position={selected.position}
          athleteId={athleteId}
          dateFormat={dateFormat}
          onClose={() => setSelected(null)}
          onExclude={exclude}
          onRestore={restore}
          onOpenActivity={(eventId) => {
            setSelected(null);
            setOpenEventId(eventId);
          }}
        />
      )}
      <Dialog
        open={openEventId !== null}
        onOpenChange={(open) => !open && setOpenEventId(null)}
      >
        <DialogContent mobileFullscreen className="sm:max-w-6xl">
          <DialogTitle className="sr-only">
            {m.records_open_activity()}
          </DialogTitle>
          {openEventId !== null && <EventDetails eventId={openEventId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
