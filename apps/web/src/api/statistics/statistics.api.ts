import client, { routes } from '@/utils/axios';

import {
  LabResponse,
  SPORT_TYPE,
  SportGroup,
  StatisticsCardiacCostDto,
  StatisticsDaysDto,
  StatisticsDurabilityDto,
  StatisticsEfficiencyDto,
  StatisticsFiltersDto,
  StatisticsIntensityDto,
  StatisticsLoadDto,
  StatisticsLongRunsDto,
  StatisticsOverviewDto,
  StatisticsRecoveryDto,
  StatisticsTerrainDto,
  StatisticsTrendsDto,
  StatisticsVolumeDto,
  TrainingCheckDto,
  statisticsFiltersSchema,
  trainingCheckSchema,
} from '@openathlete/shared';

export interface StatisticsSectionParams {
  athleteId: number;
  from: Date;
  to: Date;
  sport?: SPORT_TYPE;
  group?: SportGroup;
}

/** Tells the API this app shows the Lab teaser (older apps get no data) */
const LAB_TEASER = { lab: 1 };

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
  ): Promise<LabResponse<StatisticsTerrainDto>> {
    const res = await client.get(routes.statistics.terrain, {
      params: { ...params, ...LAB_TEASER },
    });
    return res.data;
  }

  static async getCardiacCost(
    params: StatisticsSectionParams & { sport: SPORT_TYPE },
  ): Promise<LabResponse<StatisticsCardiacCostDto>> {
    const res = await client.get(routes.statistics.cardiacCost, {
      params: { ...params, ...LAB_TEASER },
    });
    return res.data;
  }

  static async getEfficiency(
    params: StatisticsSectionParams & { sport: SPORT_TYPE },
  ): Promise<StatisticsEfficiencyDto> {
    const res = await client.get(routes.statistics.efficiency, { params });
    return res.data;
  }

  /** The training check of a runner. */
  static async getCheck(athleteId?: number): Promise<TrainingCheckDto> {
    const res = await client.get(routes.statistics.check, {
      params: { athleteId },
    });
    return trainingCheckSchema.parse(res.data);
  }

  static async getDurability(
    params: StatisticsSectionParams & { sport: SPORT_TYPE },
  ): Promise<LabResponse<StatisticsDurabilityDto>> {
    const res = await client.get(routes.statistics.durability, {
      params: { ...params, ...LAB_TEASER },
    });
    return res.data;
  }

  static async getRecovery(
    params: StatisticsSectionParams,
  ): Promise<StatisticsRecoveryDto> {
    const res = await client.get(routes.statistics.recovery, { params });
    return res.data;
  }

  static async getTrends(
    params: StatisticsSectionParams & { sport: SPORT_TYPE },
  ): Promise<LabResponse<StatisticsTrendsDto>> {
    const res = await client.get(routes.statistics.trends, {
      params: { ...params, ...LAB_TEASER },
    });
    return res.data;
  }

  static async getLoad(
    params: StatisticsSectionParams,
  ): Promise<StatisticsLoadDto> {
    const res = await client.get(routes.statistics.load, { params });
    return res.data;
  }
}
