import axios, { isAxiosError } from 'axios';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConnectorProvider, ProviderAccount } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { InvalidRefreshTokenError } from '../errors/invalid-refresh-token.error';

export interface FullImportResult {
  queuedActivities: number;
  backfillRequested?: boolean;
}

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
  protected abstract readonly provider: ConnectorProvider;
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
  async getValidAccessToken(account: ProviderAccount): Promise<string> {
    // Don't refresh tokens for revoked accounts
    if (account.status !== 'active') {
      throw new InvalidRefreshTokenError(
        this.provider,
        account.providerAccountId,
        account.athleteId,
        `Provider account is ${account.status}, cannot refresh token`,
      );
    }

    // If access token exists and not expired, return it
    if (
      account.accessToken &&
      account.expiresAt &&
      new Date() < account.expiresAt
    ) {
      return account.accessToken;
    }

    // Refresh token
    if (!account.refreshToken) {
      throw new Error(`No refresh token available for ${this.provider}`);
    }

    this.logger.debug(
      `Refreshing access token for ${this.provider} (athlete ${account.athleteId})`,
    );

    try {
      const tokenResponse = await this.refreshAccessToken(account.refreshToken);

      // Calculate expiration
      const expiresAt = tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : null;

      // Determine which refresh token to store
      // Some providers return a new refresh_token, others don't
      const refreshTokenToStore =
        tokenResponse.refresh_token ?? account.refreshToken;

      // Update stored tokens
      const updatedAccount = await this.prisma.providerAccount.update({
        where: {
          providerAccountId: account.providerAccountId,
        },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: refreshTokenToStore,
          expiresAt: expiresAt,
        },
      });

      this.logger.debug(
        `Token refreshed and stored for ${this.provider} account ${account.providerAccountId}: access_token length=${tokenResponse.access_token.length}, refresh_token ${tokenResponse.refresh_token ? 'updated' : 'kept existing'}, expires_at=${expiresAt?.toISOString() || 'null'}`,
      );

      return updatedAccount.accessToken;
    } catch (error) {
      // If refresh token is invalid (401), mark account as revoked
      if (
        isAxiosError(error) &&
        error.response?.status === 401 &&
        account.status === 'active'
      ) {
        this.logger.warn(
          `Refresh token invalid for ${this.provider} account ${account.providerAccountId} (athlete ${account.athleteId}), marking as revoked`,
        );

        await this.prisma.providerAccount.update({
          where: {
            providerAccountId: account.providerAccountId,
          },
          data: {
            status: 'revoked' as const,
          },
        });

        throw new InvalidRefreshTokenError(
          this.provider,
          account.providerAccountId,
          account.athleteId,
        );
      }

      // Re-throw other errors
      throw error;
    }
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
  }): Promise<ProviderAccount> {
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

    const existing = await this.prisma.providerAccount.findFirst({
      where: {
        athleteId: athleteId,
        provider: this.provider,
      },
    });

    if (existing) {
      return this.prisma.providerAccount.update({
        where: {
          providerAccountId: existing.providerAccountId,
        },
        data: {
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresAt: expiresAt,
          scopes: scopes ?? existing.scopes,
          status: 'active',
          externalUserId: externalUserId ?? existing.externalUserId,
        },
      });
    }

    return this.prisma.providerAccount.create({
      data: {
        athleteId: athleteId,
        provider: this.provider,
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
        scopes: scopes ?? null,
        status: 'active',
        externalUserId: externalUserId ?? null,
      },
    });
  }
}
