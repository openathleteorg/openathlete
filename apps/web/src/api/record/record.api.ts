import client, { routes } from '@/utils/axios';

import { Record, SPORT_TYPE } from '@openathlete/shared';

export class RecordAPI {
  static async getRecords(
    sport?: SPORT_TYPE,
    athleteId?: number,
  ): Promise<Record[]> {
    const res = await client.get(routes.record.getRecords, {
      params: {
        sport,
        athleteId,
      },
    });
    return res.data;
  }
}
