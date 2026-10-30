import { useGetRecordSportsQuery, useGetRecordsQuery } from '@/api/record';
import { EventDetails } from '@/components/event-details/event-details';
import { RECORD_METRICS } from '@/components/records/record-metrics';
import { RecordsCurveChart } from '@/components/records/records-curve-chart';
import { RecordsTable } from '@/components/records/records-table';
import { TrainingPacesCard } from '@/components/records/training-paces-card';
import { SportSelect } from '@/components/sport-select/sport-select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PageTitle } from '@/components/ui/page-title';
import { SkeletonChart } from '@/components/ui/skeleton';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { useMemo, useState } from 'react';

import { SPORT_TYPE } from '@openathlete/shared';

interface P {
  athleteId?: number;
}

/** All time, then this season and the previous one (calendar years, UTC). */
function usePeriods() {
  return useMemo(() => {
    const year = new Date().getUTCFullYear();
    const start = (y: number) => new Date(Date.UTC(y, 0, 1));
    return [
      { key: 'allTime', label: m.all_time(), color: 'var(--chart-1)' },
      {
        key: 'thisYear',
        label: `${year}`,
        color: 'var(--chart-2)',
        from: start(year),
        to: start(year + 1),
      },
      {
        key: 'lastYear',
        label: `${year - 1}`,
        color: 'var(--chart-4)',
        from: start(year - 1),
        to: start(year),
      },
    ];
  }, []);
}

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
  const [allTime, thisYear, lastYear] = usePeriods();
  const query = (period: { from?: Date; to?: Date }) => ({
    sport: sport ?? undefined,
    athleteId,
    from: period.from,
    to: period.to,
  });
  const enabled = { enabled: sport !== null };
  const allTimeRecords = useGetRecordsQuery(query(allTime), enabled);
  const thisYearRecords = useGetRecordsQuery(query(thisYear), enabled);
  const lastYearRecords = useGetRecordsQuery(query(lastYear), enabled);
  const [openEventId, setOpenEventId] = useState<number | null>(null);
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });

  const pageTitle = isCurrentUser
    ? m.my_records()
    : m.records_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });
  const isLoading =
    isLoadingSports || (sport !== null && allTimeRecords.isPending);
  const periods = [
    { ...allTime, records: allTimeRecords.data ?? [] },
    { ...thisYear, records: thisYearRecords.data ?? [] },
    { ...lastYear, records: lastYearRecords.data ?? [] },
  ];
  const metrics = RECORD_METRICS.filter((metric) =>
    periods[0].records.some((record) => record.type === metric.type),
  );

  return (
    <div className="w-full p-4 md:p-8 flex flex-col gap-4">
      <PageTitle desktopOnly>{pageTitle}</PageTitle>
      <div className="flex flex-wrap items-center gap-3">
        {sports && sports.length > 0 && (
          <SportSelect
            selected={sport}
            onChange={setChosenSport}
            sports={sports}
            allowAll={false}
          />
        )}
        <p className="text-sm text-muted-foreground">{m.records_help()}</p>
      </div>
      {isLoading ? (
        <SkeletonChart className="h-[400px]" />
      ) : sport === null || metrics.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-lg font-semibold">
              {m.no_records_found({ sport: '' })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sport === SPORT_TYPE.RUNNING && (
            // This season says more of the current level than an old best
            <TrainingPacesCard
              recordSets={[periods[1].records, periods[0].records]}
            />
          )}
          {metrics.map((metric) => (
            <Card key={metric.type} data-records-metric={metric.type}>
              <CardHeader>
                <CardTitle>{metric.title(sport)}</CardTitle>
                <CardDescription>
                  {metric.axis === 'distance'
                    ? m.records_by_distance({ unit: metric.unit(sport) })
                    : m.records_by_duration({ unit: metric.unit(sport) })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <RecordsCurveChart
                  metric={metric}
                  sport={sport}
                  series={periods}
                />
                <RecordsTable
                  metric={metric}
                  sport={sport}
                  columns={periods}
                  onOpenActivity={setOpenEventId}
                />
              </CardContent>
            </Card>
          ))}
        </div>
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
