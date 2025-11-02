import axios, { isAxiosError } from 'axios';
import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { connector_provider } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import {
  BaseProviderService,
  OAuthConfig,
  OAuthTokenResponse,
} from '../base/base-provider.service';

/**
 * Garmin Connect Developer Program API uses OAuth 2.0 with PKCE (Proof Key for Code Exchange)
 *
 * Documentation: https://developerportal.garmin.com/
 * Note: Exact token endpoint URL not publicly available - requires Garmin Developer Program approval
 *
 * OAuth 2.0 PKCE Flow:
 * 1. Generate code_verifier (random string)
 * 2. Generate code_challenge = BASE64URL(SHA256(code_verifier))
 * 3. Include code_challenge in authorization URL
 * 4. Exchange code with code_verifier (not client_secret for PKCE)
 */
@Injectable()
export class GarminProviderService extends BaseProviderService {
  protected readonly provider = connector_provider.GARMIN;

  protected get oauthConfig(): OAuthConfig {
    return {
      // Based on Garmin OAuth 2.0 PKCE documentation (2024)
      authorizationUrl: 'https://apis.garmin.com/tools/oauth2/authorizeUser',
      // Token URL not publicly documented - requires Garmin Developer Program approval
      // Placeholder: will need to be confirmed with Garmin upon application approval
      // Default URL based on Garmin API patterns - to be confirmed with official documentation
      tokenUrl: 'https://apis.garmin.com/tools/oauth2/token',
      clientId: this.configService.get('GARMIN_CLIENT_ID') || '',
      clientSecret: this.configService.get('GARMIN_CLIENT_SECRET') || '', // May not be required for PKCE
      redirectUri: this.configService.get('GARMIN_REDIRECT_URI') || '',
      // Scopes to be confirmed with Garmin upon Developer Program approval
      // Placeholder scopes for activity read and workout write
      scopes: ['activity:read', 'workout:write'],
    };
  }

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    super(prisma, configService);
  }

  /**
   * Generate PKCE code verifier and challenge
   * Code verifier: random URL-safe string, 43-128 characters
   * Code challenge: BASE64URL(SHA256(code_verifier))
   */
  private generatePKCE(): { verifier: string; challenge: string } {
    // Generate random code verifier (43-128 characters, URL-safe)
    const verifier = randomBytes(32).toString('base64url');

    // Generate code challenge: BASE64URL(SHA256(code_verifier))
    const challenge = createHash('sha256').update(verifier).digest('base64url');

    return { verifier, challenge };
  }

  /**
   * Get authorization URI with PKCE parameters
   * Returns both URI and code_verifier (client must store and send back during token exchange)
   * This is the recommended method for Garmin OAuth
   */
  getAuthorizationUriWithPKCE(state?: string): {
    uri: string;
    codeVerifier: string;
  } {
    const { verifier, challenge } = this.generatePKCE();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.oauthConfig.clientId,
      redirect_uri: this.oauthConfig.redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      scope: this.oauthConfig.scopes.join(','),
      ...(state && { state }),
    });

    return {
      uri: `${this.oauthConfig.authorizationUrl}?${params.toString()}`,
      codeVerifier: verifier,
    };
  }

  /**
   * Standard getAuthorizationUri for compatibility
   * Note: For Garmin PKCE, use getAuthorizationUriWithPKCE instead to get code_verifier
   */
  override getAuthorizationUri(state?: string): string {
    const { challenge } = this.generatePKCE();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.oauthConfig.clientId,
      redirect_uri: this.oauthConfig.redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      scope: this.oauthConfig.scopes.join(','),
      ...(state && { state }),
    });

    return `${this.oauthConfig.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Override token exchange to use PKCE (code_verifier instead of client_secret)
   * Note: Garmin PKCE flow uses code_verifier, not client_secret
   * The code_verifier must match the code_challenge sent in authorization
   */
  override async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string,
  ): Promise<OAuthTokenResponse> {
    if (!codeVerifier) {
      throw new Error(
        'PKCE code_verifier is required for Garmin OAuth token exchange',
      );
    }

    try {
      // Garmin PKCE token exchange uses form-urlencoded (not JSON)
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.oauthConfig.redirectUri,
        client_id: this.oauthConfig.clientId,
        code_verifier: codeVerifier,
      });

      const { data } = await axios.post<OAuthTokenResponse>(
        this.oauthConfig.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Garmin OAuth token exchange failed: ${JSON.stringify(error.response?.data)}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Note: Garmin refresh token endpoint and flow to be confirmed
   * May require PKCE or may use standard refresh token flow
   */
  override async refreshAccessToken(
    refreshToken: string,
  ): Promise<OAuthTokenResponse> {
    try {
      // Refresh token format to be confirmed with Garmin
      // May require form-urlencoded similar to token exchange
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.oauthConfig.clientId,
        // Note: May or may not require client_secret for refresh
      });

      const { data } = await axios.post<OAuthTokenResponse>(
        this.oauthConfig.tokenUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Garmin token refresh failed: ${JSON.stringify(error.response?.data)}`,
          error.stack,
        );
      }
      throw error;
    }
  }
}
