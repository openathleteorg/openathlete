import client, { routes } from '@/utils/axios';

import { AthleteInjury } from '@openathlete/shared';

export class InjuryAPI {
  static async getInjuries(athleteId?: number): Promise<AthleteInjury[]> {
    const res = await client.get(routes.injury.getInjuries, {
      params: athleteId ? { athleteId } : undefined,
    });
    return res.data;
  }
}
