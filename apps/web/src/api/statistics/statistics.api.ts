import client, { routes } from '@/utils/axios';

import {
  SPORT_TYPE,
  SportGroup,
  StatisticsCardiacCostDto,
  StatisticsDaysDto,
  StatisticsDurabilityDto,
  StatisticsFiltersDto,
  StatisticsIntensityDto,
  StatisticsLoadDto,
  StatisticsLongRunsDto,
  StatisticsOverviewDto,
  StatisticsTerrainDto,
  StatisticsTrendsDto,
  StatisticsVolumeDto,
  statisticsFiltersSchema,
} from '@openathlete/shared';

export interface StatisticsSectionParams {
  athleteId: number;
  from: Date;
  to: Date;
  sport?: SPORT_TYPE;
  group?: SportGroup;
}

export class StatisticsAPI {
  static async getFilters(athleteId: number): Promise<StatisticsFiltersDto> {
    const res = await client.get(routes.statistics.filters, {
      params: { athleteId },
    });
    // firstActivityDate arrives as an ISO string
    return statisticsFiltersSchema.parse(res.data);
  }

  static async getOverview(
    params: StatisticsSectionParams & { compareFrom?: Date; compareTo?: Date },
  ): Promise<StatisticsOverviewDto> {
    const res = await client.get(routes.statistics.overview, { params });
    return res.data;
  }

  static async getVolume(
    params: StatisticsSectionParams,
  ): Promise<StatisticsVolumeDto> {
    const res = await client.get(routes.statistics.volume, { params });
    return res.data;
  }

  static async getDays(
    params: StatisticsSectionParams,
  ): Promise<StatisticsDaysDto> {
    const res = await client.get(routes.statistics.days, { params });
    return res.data;
  }

  static async getIntensity(
    params: StatisticsSectionParams,
  ): Promise<StatisticsIntensityDto> {
    const res = await client.get(routes.statistics.intensity, { params });
    return res.data;
  }

  static async getLongRuns(
    params: StatisticsSectionParams,
  ): Promise<StatisticsLongRunsDto> {
    const res = await client.get(routes.statistics.longRuns, { params });
    return res.data;
  }

  static async getTerrain(
    params: StatisticsSectionParams & { sport: SPORT_TYPE },
  ): Promise<StatisticsTerrainDto> {
    const res = await client.get(routes.statistics.terrain, { params });
    return res.data;
  }

  static async getCardiacCost(
    params: StatisticsSectionParams & { sport: SPORT_TYPE },
  ): Promise<StatisticsCardiacCostDto> {
    const res = await client.get(routes.statistics.cardiacCost, { params });
    return res.data;
  }

  static async getDurability(
    params: StatisticsSectionParams & { sport: SPORT_TYPE },
  ): Promise<StatisticsDurabilityDto> {
    const res = await client.get(routes.statistics.durability, { params });
    return res.data;
  }

  static async getTrends(
    params: StatisticsSectionParams & { sport: SPORT_TYPE },
  ): Promise<StatisticsTrendsDto> {
    const res = await client.get(routes.statistics.trends, { params });
    return res.data;
  }

  static async getLoad(
    params: StatisticsSectionParams,
  ): Promise<StatisticsLoadDto> {
    const res = await client.get(routes.statistics.load, { params });
    return res.data;
  }
}
