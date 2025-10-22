import client, { routes } from '@/utils/axios';

import { GetStatisticsForPeriodDto } from '@openathlete/shared';

export class StatisticsAPI {
  static async getStatisticsForPeriod(
    athleteId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<GetStatisticsForPeriodDto> {
    const res = await client.get(
      routes.statistics.getStatisticsForPeriod(
        athleteId,
        startDate.toISOString(),
        endDate.toISOString(),
      ),
    );
    return res.data;
  }
}
