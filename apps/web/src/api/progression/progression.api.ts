import client, { routes } from '@/utils/axios';

import { GetProgressionDataResponseDto, SPORT_TYPE } from '@openathlete/shared';

export class ProgressionAPI {
  static async getFirstActivityDate(
    athleteId: number,
    sport?: SPORT_TYPE,
  ): Promise<Date | null> {
    const res = await client.get(
      routes.progression.getFirstActivityDate(
        athleteId,
        sport ? sport : undefined,
      ),
    );
    return res.data ? new Date(res.data) : null;
  }

  static async getProgressionData(
    athleteId: number,
    startDate: Date,
    endDate: Date,
    sport?: SPORT_TYPE,
  ): Promise<GetProgressionDataResponseDto> {
    const res = await client.get(
      routes.progression.getProgressionData(
        athleteId,
        startDate.toISOString(),
        endDate.toISOString(),
        sport,
      ),
    );
    return res.data;
  }
}
