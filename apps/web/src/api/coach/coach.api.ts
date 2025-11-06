import client, { routes } from '@/utils/axios';

import { CoachDashboardResponseDto } from '@openathlete/shared';

export class CoachAPI {
  static async getDashboard(
    start?: Date,
    end?: Date,
  ): Promise<CoachDashboardResponseDto> {
    const res = await client.get(
      routes.coach.dashboard(
        start?.toISOString(),
        end?.toISOString(),
      ),
    );
    return res.data;
  }
}


