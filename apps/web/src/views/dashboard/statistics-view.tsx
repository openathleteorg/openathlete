import { useStatisticsFiltersQuery } from '@/api/statistics';
import { IntensitySection } from '@/components/statistics/intensity-section';
import { LoadSection } from '@/components/statistics/load-section';
import { PerformanceSection } from '@/components/statistics/performance-section';
import { RegularitySection } from '@/components/statistics/regularity-section';
import { StatisticsFilters } from '@/components/statistics/statistics-filters';
import { StatisticsInsight } from '@/components/statistics/statistics-insight';
import { SummarySection } from '@/components/statistics/summary-section';
import { TrendsSection } from '@/components/statistics/trends-section';
import { useStatisticsFilters } from '@/components/statistics/use-statistics-filters';
import { VolumeSection } from '@/components/statistics/volume-section';
import { PageTitle } from '@/components/ui/page-title';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';

interface P {
  athleteId: number;
}

export function StatisticsView({ athleteId }: P) {
  const { data: options } = useStatisticsFiltersQuery(athleteId);
  const filters = useStatisticsFilters(options?.firstActivityDate);
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });
  const { period, compared, sport, group } = filters;

  const pageTitle = isCurrentUser
    ? m.my_statistics()
    : m.statistics_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  return (
    <div className="w-full space-y-6 p-4 md:p-8 md:pt-6">
      <PageTitle desktopOnly>{pageTitle}</PageTitle>
      <StatisticsInsight athleteId={athleteId} period={period} sport={sport} />
      <StatisticsFilters filters={filters} sports={options?.sports ?? []} />
      <SummarySection
        athleteId={athleteId}
        period={period}
        compared={compared}
        sport={sport}
        group={group}
      />
      <VolumeSection
        athleteId={athleteId}
        period={period}
        compared={compared}
        sport={sport}
        group={group}
      />
      <RegularitySection
        athleteId={athleteId}
        period={period}
        sport={sport}
        group={group}
      />
      <LoadSection
        athleteId={athleteId}
        period={period}
        compared={compared}
        sport={sport}
        group={group}
      />
      <IntensitySection
        athleteId={athleteId}
        period={period}
        compared={compared}
        sport={sport}
        group={group}
      />
      <PerformanceSection
        athleteId={athleteId}
        period={period}
        compared={compared}
        sport={sport}
      />
      <TrendsSection
        athleteId={athleteId}
        period={period}
        compared={compared}
        sport={sport}
      />
    </div>
  );
}
