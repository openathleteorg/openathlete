import { useStatisticsFiltersQuery } from '@/api/statistics';
import { EnduranceSection } from '@/components/statistics/endurance-section';
import { IntensitySection } from '@/components/statistics/intensity-section';
import { LoadSection } from '@/components/statistics/load-section';
import { PerformanceSection } from '@/components/statistics/performance-section';
import { PhysiologySection } from '@/components/statistics/physiology-section';
import { ProfileSection } from '@/components/statistics/profile-section';
import { RecoverySection } from '@/components/statistics/recovery-section';
import { RegularitySection } from '@/components/statistics/regularity-section';
import { SportPicker } from '@/components/statistics/sport-picker';
import { StatisticsFilters } from '@/components/statistics/statistics-filters';
import { StatisticsInsight } from '@/components/statistics/statistics-insight';
import {
  CapacityTabs,
  StatisticsTabs,
} from '@/components/statistics/statistics-tabs';
import { SummarySection } from '@/components/statistics/summary-section';
import { TerrainSection } from '@/components/statistics/terrain-section';
import { TrendsSection } from '@/components/statistics/trends-section';
import { useStatisticsFilters } from '@/components/statistics/use-statistics-filters';
import { VolumeSection } from '@/components/statistics/volume-section';
import { YearReviewSection } from '@/components/statistics/year-review-section';
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

  // A view on one sport opens on the most practised one, never on a dead end
  const oneSport = sport ?? options?.sports[0] ?? null;

  return (
    <div className="w-full space-y-4 p-4 md:space-y-6 md:p-8 md:pt-6">
      <PageTitle desktopOnly>{pageTitle}</PageTitle>
      {filters.view !== 'review' && (
        <StatisticsFilters filters={filters} sports={options?.sports ?? []} />
      )}
      <StatisticsTabs value={filters.view} onChange={filters.setView} />
      {filters.view === 'overview' && (
        <>
          <StatisticsInsight
            athleteId={athleteId}
            period={period}
            sport={sport}
          />
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
        </>
      )}
      {filters.view === 'load' && (
        <>
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
          <RecoverySection athleteId={athleteId} period={period} />
        </>
      )}
      {filters.view === 'review' && (
        <YearReviewSection
          athleteId={athleteId}
          firstActivityDate={options?.firstActivityDate}
        />
      )}
      {(filters.view === 'capacities' || filters.view === 'trends') &&
        oneSport && (
          <>
            <SportPicker
              sports={options?.sports ?? []}
              value={oneSport}
              onChange={filters.setSport}
            />
            {filters.view === 'capacities' ? (
              <>
                <CapacityTabs
                  value={filters.capacity}
                  onChange={filters.setCapacity}
                />
                {filters.capacity === 'profile' && (
                  <ProfileSection athleteId={athleteId} sport={oneSport} />
                )}
                {filters.capacity === 'terrain' && (
                  <TerrainSection
                    athleteId={athleteId}
                    period={period}
                    sport={oneSport}
                  />
                )}
                {filters.capacity === 'endurance' && (
                  <EnduranceSection
                    athleteId={athleteId}
                    period={period}
                    sport={oneSport}
                  />
                )}
                {filters.capacity === 'physiology' && (
                  <PhysiologySection
                    athleteId={athleteId}
                    period={period}
                    compared={compared}
                    sport={oneSport}
                  />
                )}
                {filters.capacity === 'performance' && (
                  <PerformanceSection
                    athleteId={athleteId}
                    period={period}
                    compared={compared}
                    sport={oneSport}
                  />
                )}
              </>
            ) : (
              <TrendsSection
                athleteId={athleteId}
                period={period}
                compared={compared}
                sport={oneSport}
              />
            )}
          </>
        )}
    </div>
  );
}
