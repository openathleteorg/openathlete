import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { SPORT_TYPE } from '@openathlete/shared';

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
) =>
  useQuery({
    ...sectionOptions(enabled),
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
    queryKey: [statisticsKeys.terrain, ...paramsKey(params)],
  });

export const useStatisticsCardiacCostQuery = (
  params: StatisticsSectionParams & { sport: SPORT_TYPE },
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getCardiacCost(params),
    queryKey: [statisticsKeys.cardiacCost, ...paramsKey(params)],
  });

export const useStatisticsDurabilityQuery = (
  params: StatisticsSectionParams & { sport: SPORT_TYPE },
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getDurability(params),
    queryKey: [statisticsKeys.durability, ...paramsKey(params)],
  });

export const useStatisticsTrendsQuery = (
  params: StatisticsSectionParams & { sport: SPORT_TYPE },
  enabled: boolean,
) =>
  useQuery({
    ...sectionOptions(enabled),
    queryFn: () => StatisticsAPI.getTrends(params),
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
