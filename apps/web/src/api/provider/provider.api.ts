import client, { routes } from '@/utils/axios';

import { ConnectorProvider } from '@openathlete/shared';

export interface ConnectedProvider {
  provider: ConnectorProvider;
  status: string;
  connectedAt: string;
}

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

  static async disconnect(
    provider: ConnectorProvider,
  ): Promise<{ success: boolean; message: string }> {
    const res = await client.post(routes.provider.disconnect(provider));
    return res.data;
  }

  static async getConnectedProviders(): Promise<ConnectedProvider[]> {
    const res = await client.get(routes.provider.getConnected);
    return res.data;
  }
}
