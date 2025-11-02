import client, { routes } from '@/utils/axios';

import { ConnectorProvider } from '@openathlete/shared';

export class ProviderAPI {
  static async getOAuthUri(provider: ConnectorProvider): Promise<string> {
    const res = await client.get(routes.provider.getOAuthUri(provider));
    return res.data.uri;
  }

  static async setOAuthToken({
    provider,
    code,
  }: {
    provider: ConnectorProvider;
    code: string;
  }): Promise<void> {
    await client.post(routes.provider.setOAuthToken(provider), { code });
  }
}

