import client, { routes } from '@/utils/axios';

import {
  SPORT_TYPE,
  StatisticsDaysDto,
  StatisticsFiltersDto,
  StatisticsIntensityDto,
  StatisticsLoadDto,
  StatisticsOverviewDto,
  StatisticsTrendsDto,
  StatisticsVolumeDto,
  statisticsFiltersSchema,
} from '@openathlete/shared';

export interface StatisticsSectionParams {
  athleteId: number;
  from: Date;
  to: Date;
  sport?: SPORT_TYPE;
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
