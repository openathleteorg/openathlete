import client, { routes } from '@/utils/axios';

import { ContactSubmissionDto } from '@openathlete/shared';

export class MarketingService {
  static async submitContact(
    body: ContactSubmissionDto,
  ): Promise<{ ok: true }> {
    const res = await client.post(routes.marketing.contact, body);
    return res.data;
  }
}
