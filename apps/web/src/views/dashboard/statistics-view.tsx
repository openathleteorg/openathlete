import { useStatisticsFiltersQuery } from '@/api/statistics';
import { IntensitySection } from '@/components/statistics/intensity-section';
import { LoadSection } from '@/components/statistics/load-section';
import { PerformanceSection } from '@/components/statistics/performance-section';
import { RegularitySection } from '@/components/statistics/regularity-section';
import { StatisticsFilters } from '@/components/statistics/statistics-filters';
import { SummarySection } from '@/components/statistics/summary-section';
import { TrendsSection } from '@/components/statistics/trends-section';
import { useStatisticsFilters } from '@/components/statistics/use-statistics-filters';
import { VolumeSection } from '@/components/statistics/volume-section';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';

interface P {
  athleteId: number;
}

export function StatisticsView({ athleteId }: P) {
  const { data: options } = useStatisticsFiltersQuery(athleteId);
  const filters = useStatisticsFilters(options?.firstActivityDate);
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });
  const { period, compared, sport } = filters;

  const pageTitle = isCurrentUser
    ? m.my_statistics()
    : m.statistics_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  return (
    <div className="w-full space-y-6 p-4 md:p-8 md:pt-6">
      <h1 className="hidden text-2xl font-semibold md:block">{pageTitle}</h1>
      <StatisticsFilters filters={filters} sports={options?.sports ?? []} />
      <SummarySection
        athleteId={athleteId}
        period={period}
        compared={compared}
        sport={sport}
      />
      <VolumeSection athleteId={athleteId} period={period} sport={sport} />
      <RegularitySection athleteId={athleteId} period={period} sport={sport} />
      <LoadSection athleteId={athleteId} period={period} sport={sport} />
      <IntensitySection athleteId={athleteId} period={period} sport={sport} />
      <PerformanceSection
        athleteId={athleteId}
        period={period}
        compared={compared}
        sport={sport}
      />
      <TrendsSection athleteId={athleteId} period={period} sport={sport} />
    </div>
  );
}
