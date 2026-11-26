import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  LabResponse,
  LabTeaserDto,
  SPORT_TYPE,
  isLockedStatistics,
} from '@openathlete/shared';

import { StatisticsAPI, StatisticsSectionParams } from './statistics.api';
import { statisticsKeys } from './statistics.keys';

const STALE_TIME = 60_000;

/**
 * Sections load on their own, once near the screen, and keep their previous
 * figures on screen while the filters change.
 */
const sectionOptions = (enabled: boolean) => ({
  enabled,
  staleTime: STALE_TIME,
  placeholderData: keepPreviousData,
});

/**
 * A Lab section's data, or nothing when the API answered with the teaser:
 * sections render only for those who have the Lab, the teaser has its own
 * hook
 */
function unlocked<T extends object>(data: LabResponse<T>): T | undefined {
  return isLockedStatistics(data) ? undefined : data;
}

const paramsKey = ({
  athleteId,
  from,
  to,
  sport,
  group,
}: StatisticsSectionParams) =>
  [
    athleteId,
    from.toISOString(),
    to.toISOString(),
    sport ?? null,
    group ?? null,
  ] as const;

export const useStatisticsFiltersQuery = (athleteId: number) =>
  useQuery({
    queryFn: () => StatisticsAPI.getFilters(athleteId),
    queryKey: [statisticsKeys.filters, athleteId],
    staleTime: STALE_TIME,
  });

export const useStatisticsOverviewQuery = (
  params: StatisticsSectionParams & { compareFrom?: Date; compareTo?: Date },
  enabled: boolean,
  /** Follows an import that brings activities in, false otherwise */
  refetchInterval: number | false = false,
) =>
  useQuery({
    ...sectionOptions(enabled),
    refetchInterval,
    queryFn: () => StatisticsAPI.getOverview(params),
    queryKey: [
      statisticsKeys.overview,
      ...paramsKey(params),
      params.compareFrom?.toISOString() ?? null,
      params.compareTo?.toISOString() ?? null,
    ],
  });

export const useStatisticsVolumeQuery = (
  params: StatisticsSectionParams,
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getVolume(params),
    queryKey: [statisticsKeys.volume, ...paramsKey(params)],
  });

export const useStatisticsDaysQuery = (
  params: StatisticsSectionParams,
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getDays(params),
    queryKey: [statisticsKeys.days, ...paramsKey(params)],
  });

export const useStatisticsIntensityQuery = (
  params: StatisticsSectionParams,
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getIntensity(params),
    queryKey: [statisticsKeys.intensity, ...paramsKey(params)],
  });

export const useStatisticsLongRunsQuery = (
  params: StatisticsSectionParams,
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getLongRuns(params),
    queryKey: [statisticsKeys.longRuns, ...paramsKey(params)],
  });

export const useStatisticsTerrainQuery = (
  params: StatisticsSectionParams & { sport: SPORT_TYPE },
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getTerrain(params),
    select: unlocked,
    queryKey: [statisticsKeys.terrain, ...paramsKey(params)],
  });

export const useStatisticsCardiacCostQuery = (
  params: StatisticsSectionParams & { sport: SPORT_TYPE },
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getCardiacCost(params),
    select: unlocked,
    queryKey: [statisticsKeys.cardiacCost, ...paramsKey(params)],
  });

export const useStatisticsEfficiencyQuery = (
  params: StatisticsSectionParams & { sport: SPORT_TYPE },
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getEfficiency(params),
    queryKey: [statisticsKeys.efficiency, ...paramsKey(params)],
  });

export const useTrainingCheckQuery = (athleteId?: number) =>
  useQuery({
    queryFn: () => StatisticsAPI.getCheck(athleteId),
    queryKey: [statisticsKeys.check, athleteId],
    staleTime: STALE_TIME,
  });

export const useTrainingCheckHistoryQuery = (athleteId?: number) =>
  useQuery({
    queryFn: () => StatisticsAPI.getCheckHistory(athleteId),
    queryKey: [statisticsKeys.checkHistory, athleteId],
    staleTime: STALE_TIME,
  });

export const useStatisticsDurabilityQuery = (
  params: StatisticsSectionParams & { sport: SPORT_TYPE },
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getDurability(params),
    select: unlocked,
    queryKey: [statisticsKeys.durability, ...paramsKey(params)],
  });

export const useStatisticsRecoveryQuery = (
  params: StatisticsSectionParams,
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getRecovery(params),
    queryKey: [statisticsKeys.recovery, ...paramsKey(params)],
  });

export const useStatisticsTrendsQuery = (
  params: StatisticsSectionParams & { sport: SPORT_TYPE },
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getTrends(params),
    select: unlocked,
    queryKey: [statisticsKeys.trends, ...paramsKey(params)],
  });

export const useStatisticsLoadQuery = (
  params: StatisticsSectionParams,
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getLoad(params),
    queryKey: [statisticsKeys.load, ...paramsKey(params)],
  });

const TEASER_DAYS = 84;

/**
 * The Lab figure the API sends someone without the Lab (null for those who
 * have it, or when there is nothing to show)
 */
export const useLabTeaserQuery = (
  athleteId: number,
  sport: SPORT_TYPE | null,
  enabled: boolean,
) =>
  useQuery({
    enabled: enabled && sport !== null,
    staleTime: 10 * STALE_TIME,
    queryKey: [statisticsKeys.labTeaser, athleteId, sport],
    queryFn: async (): Promise<LabTeaserDto> => {
      const to = new Date();
      const from = new Date(to.getTime() - TEASER_DAYS * 24 * 60 * 60 * 1000);
      const data = await StatisticsAPI.getTrends({
        athleteId,
        sport: sport as SPORT_TYPE,
        from,
        to,
      });
      return isLockedStatistics(data) ? data.teaser : null;
    },
  });
