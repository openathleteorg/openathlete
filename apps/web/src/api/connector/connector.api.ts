import client, { routes } from '@/utils/axios';

import { ConnectorProvider } from '@openathlete/shared';

export class ConnectorAPI {
  static async getOAuthUri(provider: ConnectorProvider): Promise<string> {
    const res = await client.get(routes.connector.getOAuthUri(provider));
    return res.data;
  }

  static async setOAuthToken({
    provider,
    code,
  }: {
    provider: ConnectorProvider;
    code: string;
  }): Promise<void> {
    await client.post(routes.connector.setOAuthToken(provider), { code });
  }
}
