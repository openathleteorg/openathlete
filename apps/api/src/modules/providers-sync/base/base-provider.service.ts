import axios, { isAxiosError } from 'axios';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { connector_provider, provider_account } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number; // seconds until expiration
  token_type?: string;
  scope?: string;
  athlete?: {
    id: number;
    name: string;
    email: string;
    profile: string;
    profile_medium: string;
  };
}

export interface OAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

@Injectable()
export abstract class BaseProviderService {
  protected readonly logger: Logger;
  protected abstract readonly provider: connector_provider;
  protected abstract readonly oauthConfig: OAuthConfig;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Generate OAuth authorization URL
   * Can be overridden for providers with special requirements (e.g., PKCE)
   */
  getAuthorizationUri(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.oauthConfig.clientId,
      redirect_uri: this.oauthConfig.redirectUri,
      response_type: 'code',
      scope: this.oauthConfig.scopes.join(','),
      ...(state && { state }),
    });

    return `${this.oauthConfig.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * Can be overridden for providers with special requirements (e.g., PKCE)
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
    try {
      const { data } = await axios.post<OAuthTokenResponse>(
        this.oauthConfig.tokenUrl,
        {
          client_id: this.oauthConfig.clientId,
          client_secret: this.oauthConfig.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.oauthConfig.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `OAuth token exchange failed: ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
      const { data } = await axios.post<OAuthTokenResponse>(
        this.oauthConfig.tokenUrl,
        {
          client_id: this.oauthConfig.clientId,
          client_secret: this.oauthConfig.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Token refresh failed: ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(account: provider_account): Promise<string> {
    // If access token exists and not expired, return it
    if (
      account.access_token &&
      account.expires_at &&
      new Date() < account.expires_at
    ) {
      return account.access_token;
    }

    // Refresh token
    if (!account.refresh_token) {
      throw new Error(`No refresh token available for ${this.provider}`);
    }

    this.logger.debug(
      `Refreshing access token for ${this.provider} (athlete ${account.athlete_id})`,
    );

    const tokenResponse = await this.refreshAccessToken(account.refresh_token);

    // Calculate expiration
    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : null;

    // Update stored tokens
    await this.prisma.provider_account.update({
      where: {
        provider_account_id: account.provider_account_id,
      },
      data: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token ?? account.refresh_token,
        expires_at: expiresAt,
      },
    });

    return tokenResponse.access_token;
  }

  /**
   * Save or update provider account after OAuth flow
   */
  async saveProviderAccount(params: {
    athleteId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
    scopes?: string;
    externalUserId?: string;
  }): Promise<provider_account> {
    const {
      athleteId,
      accessToken,
      refreshToken,
      expiresIn,
      scopes,
      externalUserId,
    } = params;

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    const existing = await this.prisma.provider_account.findFirst({
      where: {
        athlete_id: athleteId,
        provider: this.provider,
      },
    });

    if (existing) {
      return this.prisma.provider_account.update({
        where: {
          provider_account_id: existing.provider_account_id,
        },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          scopes: scopes ?? existing.scopes,
          status: 'active',
          external_user_id: externalUserId ?? existing.external_user_id,
        },
      });
    }

    return this.prisma.provider_account.create({
      data: {
        athlete_id: athleteId,
        provider: this.provider,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        scopes: scopes ?? null,
        status: 'active',
        external_user_id: externalUserId ?? null,
      },
    });
  }
}
