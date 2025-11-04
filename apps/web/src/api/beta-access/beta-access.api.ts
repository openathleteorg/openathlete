import client, { routes } from '@/utils/axios';

import { BetaAccessRequestDto } from '@openathlete/shared';

export class BetaAccessAPI {
  static async request(body: BetaAccessRequestDto): Promise<void> {
    await client.post(routes.betaAccess.request, body);
  }
}

