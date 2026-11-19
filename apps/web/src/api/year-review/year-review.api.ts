import client, { routes } from '@/utils/axios';

import { YearReviewDto, yearReviewSchema } from '@openathlete/shared';

export class YearReviewAPI {
  static async get(athleteId: number, year: number): Promise<YearReviewDto> {
    const res = await client.get(routes.yearReview, {
      params: { athleteId, year },
    });
    // Dates arrive as ISO strings
    return yearReviewSchema.parse(res.data);
  }
}
