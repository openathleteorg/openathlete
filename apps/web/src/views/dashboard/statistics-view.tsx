import { useStatisticsFiltersQuery } from '@/api/statistics';
import { GarminAttribution } from '@/components/garmin-attribution/garmin-attribution';
import { EfficiencyCard } from '@/components/statistics/efficiency-card';
import { hasEfficiencyRuns } from '@/components/statistics/efficiency-data';
import { EnduranceSection } from '@/components/statistics/endurance-section';
import { IntensitySection } from '@/components/statistics/intensity-section';
import {
  LabOverviewCard,
  LabPreview,
} from '@/components/statistics/lab-preview';
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
import {
  LAB_VIEWS,
  useStatisticsFilters,
} from '@/components/statistics/use-statistics-filters';
import { VolumeSection } from '@/components/statistics/volume-section';
import { YearReviewSection } from '@/components/statistics/year-review-section';
import { PageTitle } from '@/components/ui/page-title';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { useFeature } from '@/hooks/use-feature';
import { m } from '@/paraglide/messages';

import { Feature } from '@openathlete/shared';

interface P {
  athleteId: number;
}

export function StatisticsView({ athleteId }: P) {
  const { data: options } = useStatisticsFiltersQuery(athleteId);
  const compare = useFeature(Feature.STATISTICS_COMPARE);
  const filters = useStatisticsFilters(
    options?.firstActivityDate,
    compare.available,
  );
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });
  const { period, compared, sport, group } = filters;
  const lab = useFeature(Feature.LAB);
  // The Android app does not show the Lab to non-Supporters: a shared link
  // to it opens the overview
  const view =
    lab.hidden && LAB_VIEWS.includes(filters.view) ? 'overview' : filters.view;

  const pageTitle = isCurrentUser
    ? m.my_statistics()
    : m.statistics_of({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
      });

  // A view on one sport opens on the most practised one, never on a dead end
  const oneSport = sport ?? options?.sports[0] ?? null;
  // Efficiency is a runner's figure: every run the filter leaves, road and
  // trail together, as they are grade adjusted
  const showEfficiency = hasEfficiencyRuns(options?.sports ?? [], sport, group);

  return (
    <div className="w-full space-y-4 p-4 md:space-y-6 md:p-8 md:pt-6">
      <PageTitle desktopOnly>{pageTitle}</PageTitle>
      {view !== 'review' && (
        <StatisticsFilters filters={filters} sports={options?.sports ?? []} />
      )}
      <StatisticsTabs value={view} onChange={filters.setView} />
      {view === 'overview' && (
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
          <LabOverviewCard
            athleteId={athleteId}
            sport={oneSport}
            onOpen={() => filters.setView('capacities')}
          />
        </>
      )}
      {view === 'load' && (
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
          {showEfficiency && (
            <EfficiencyCard
              athleteId={athleteId}
              period={period}
              sport={sport}
              group={group}
              visible
            />
          )}
        </>
      )}
      {view === 'review' && (
        <YearReviewSection
          athleteId={athleteId}
          firstActivityDate={options?.firstActivityDate}
        />
      )}
      {(view === 'capacities' || view === 'trends') && oneSport && (
        <>
          <SportPicker
            sports={options?.sports ?? []}
            value={oneSport}
            onChange={filters.setSport}
          />
          {lab.locked ? (
            <LabPreview athleteId={athleteId} sport={oneSport} />
          ) : view === 'capacities' ? (
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
      <GarminAttribution athleteId={athleteId} />
    </div>
  );
}
