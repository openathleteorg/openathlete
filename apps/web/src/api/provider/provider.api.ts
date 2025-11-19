import client, { routes } from '@/utils/axios';

import { ConnectorProvider } from '@openathlete/shared';

export interface ConnectedProvider {
  provider: ConnectorProvider;
  status: string;
  connectedAt: string;
}

export interface GetOAuthUriResponse {
  uri: string;
  codeVerifier?: string; // For PKCE providers like Garmin
}

export class ProviderAPI {
  static async getOAuthUri(
    provider: ConnectorProvider,
  ): Promise<GetOAuthUriResponse> {
    const res = await client.get(routes.provider.getOAuthUri(provider));
    return res.data;
  }

  static async setOAuthToken({
    provider,
    code,
    codeVerifier,
  }: {
    provider: ConnectorProvider;
    code: string;
    codeVerifier?: string;
  }): Promise<void> {
    await client.post(routes.provider.setOAuthToken(provider), {
      code,
      ...(codeVerifier && { codeVerifier }),
    });
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
