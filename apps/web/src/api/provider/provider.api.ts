import client, { routes } from '@/utils/axios';

import {
  ActivityDescriptionPreviewQueryDto,
  ActivityDescriptionPreviewResponseDto,
  ConnectorProvider,
  CorosRegion,
  EmailLanguage,
  ImportAllActivitiesDto,
  ProviderPreferencesDto,
} from '@openathlete/shared';

export interface ConnectedProvider {
  provider: ConnectorProvider;
  status: string;
  connectedAt: string;
  importActivitiesEnabled: boolean;
  exportWorkoutsEnabled: boolean;
  importMetricsEnabled: boolean;
  /** OpenAthlete's analysis written into new activities (Strava) */
  activityDescriptionEnabled: boolean;
  /** null: the user's language */
  activityDescriptionLanguage: EmailLanguage | null;
  /** The connection allows editing activities; otherwise connect again */
  activityDescriptionAuthorized: boolean;
  fullImportRequestedAt: string | null;
  fullImportCompletedAt: string | null;
}

export interface GetOAuthUriResponse {
  uri: string;
  codeVerifier?: string; // For PKCE providers: Garmin, COROS
}

export interface ImportAllActivitiesResponse {
  success: boolean;
  message?: string;
  // The import runs in the background; follow it through fullImportCompletedAt
  queued?: boolean;
}

export class ProviderAPI {
  static async getOAuthUri({
    provider,
    region,
  }: {
    provider: ConnectorProvider;
    region?: CorosRegion;
  }): Promise<GetOAuthUriResponse> {
    const res = await client.get(routes.provider.getOAuthUri(provider), {
      params: { region },
    });
    return res.data;
  }

  static async setOAuthToken({
    provider,
    code,
    codeVerifier,
    scope,
  }: {
    provider: ConnectorProvider;
    code: string;
    codeVerifier?: string;
    /** Scopes the user accepted, from the redirect (Strava) */
    scope?: string;
  }): Promise<void> {
    await client.post(routes.provider.setOAuthToken(provider), {
      code,
      ...(codeVerifier && { codeVerifier }),
      ...(scope && { scope }),
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

  static async updatePreferences(
    provider: ConnectorProvider,
    payload: ProviderPreferencesDto,
  ): Promise<{ success: boolean }> {
    const res = await client.patch(
      routes.provider.updatePreferences(provider),
      payload,
    );
    return res.data;
  }

  static async getActivityDescriptionPreview(
    params: ActivityDescriptionPreviewQueryDto,
  ): Promise<ActivityDescriptionPreviewResponseDto> {
    const res = await client.get(routes.provider.activityDescriptionPreview, {
      params,
    });
    return res.data;
  }

  static async importAllActivities(
    provider: ConnectorProvider,
    options?: ImportAllActivitiesDto,
  ): Promise<ImportAllActivitiesResponse> {
    const res = await client.post(
      routes.provider.importAllActivities(provider),
      options ?? {},
    );
    return res.data;
  }
}
