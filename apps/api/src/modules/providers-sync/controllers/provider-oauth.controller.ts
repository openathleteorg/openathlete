import { Request, Response } from 'express';

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { connector_provider } from '@openathlete/database';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { PrismaService } from '../../prisma/services/prisma.service';
import {
  CorosProviderService,
  GarminProviderService,
  StravaProviderService,
  SuuntoProviderService,
} from '../providers';

@Controller('provider')
export class ProviderOAuthController {
  constructor(
    private readonly stravaProviderService: StravaProviderService,
    private readonly garminProviderService: GarminProviderService,
    private readonly suuntoProviderService: SuuntoProviderService,
    private readonly corosProviderService: CorosProviderService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get OAuth authorization URI for a provider
   * For Garmin (PKCE), also returns code_verifier that must be sent back during token exchange
   */
  @Get(':provider/uri')
  getAuthorizationUri(@Param('provider') provider: string) {
    const providerEnum = provider.toUpperCase() as connector_provider;

    switch (providerEnum) {
      case connector_provider.STRAVA:
        return { uri: this.stravaProviderService.getAuthorizationUri() };
      case connector_provider.GARMIN:
        // Garmin uses PKCE - return both URI and code_verifier
        // Client must store code_verifier and send it back during token exchange
        // Note: In production, code_verifier should be stored server-side (session/Redis)
        // For now, returning it to client - they must store it securely and send it back
        return this.garminProviderService.getAuthorizationUriWithPKCE();
      case connector_provider.SUUNTO:
        return { uri: this.suuntoProviderService.getAuthorizationUri() };
      case connector_provider.COROS:
        return { uri: this.corosProviderService.getAuthorizationUri() };
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  /**
   * Exchange OAuth code for tokens and save provider account
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post(':provider/token')
  async connectProvider(
    @JwtUser() user: AuthUser,
    @Param('provider') provider: string,
    @Body() body: { code: string; codeVerifier?: string },
  ) {
    const { code } = body;
    const providerEnum = provider.toUpperCase() as connector_provider;

    // Get athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: user.user_id },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    switch (providerEnum) {
      case connector_provider.STRAVA:
        return this.stravaProviderService.connect(user, code);
      case connector_provider.GARMIN: {
        // Garmin PKCE requires code_verifier
        const codeVerifier = body.codeVerifier;
        if (!codeVerifier) {
          throw new Error(
            'codeVerifier is required for Garmin OAuth (PKCE flow)',
          );
        }
        const tokenResponse =
          await this.garminProviderService.exchangeCodeForTokens(
            code,
            codeVerifier,
          );
        return this.garminProviderService.saveProviderAccount({
          athleteId: athlete.athlete_id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || '',
          expiresIn: tokenResponse.expires_in,
          scopes: tokenResponse.scope,
        });
      }
      case connector_provider.SUUNTO: {
        const tokenResponse =
          await this.suuntoProviderService.exchangeCodeForTokens(code);
        return this.suuntoProviderService.saveProviderAccount({
          athleteId: athlete.athlete_id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || '',
          expiresIn: tokenResponse.expires_in,
          scopes: tokenResponse.scope,
        });
      }
      case connector_provider.COROS: {
        const tokenResponse =
          await this.corosProviderService.exchangeCodeForTokens(code);
        return this.corosProviderService.saveProviderAccount({
          athleteId: athlete.athlete_id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || '',
          expiresIn: tokenResponse.expires_in,
          scopes: tokenResponse.scope,
        });
      }
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  /**
   * Disconnect a provider account
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post(':provider/disconnect')
  async disconnectProvider(
    @JwtUser() user: AuthUser,
    @Param('provider') provider: string,
  ) {
    const providerEnum = provider.toUpperCase() as connector_provider;

    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: user.user_id },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    const account = await this.prisma.provider_account.findFirst({
      where: {
        athlete_id: athlete.athlete_id,
        provider: providerEnum,
      },
    });

    if (!account) {
      throw new Error('Provider account not found');
    }

    // Update status to revoked instead of deleting
    await this.prisma.provider_account.update({
      where: {
        provider_account_id: account.provider_account_id,
      },
      data: {
        status: 'revoked',
      },
    });

    return { success: true, message: `Disconnected from ${provider}` };
  }

  /**
   * Get connected providers for current user
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('connected')
  async getConnectedProviders(@JwtUser() user: AuthUser) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: user.user_id },
      include: {
        provider_accounts: {
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!athlete) {
      return [];
    }

    return athlete.provider_accounts.map((account) => ({
      provider: account.provider,
      status: account.status,
      connectedAt: account.created_at,
    }));
  }

  /**
   * Strava webhook verification (GET)
   */
  @Get('strava/webhook')
  async stravaWebhookGet(@Req() request: Request, @Res() response: Response) {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
    if (mode === 'subscribe' && token === verifyToken) {
      return response.status(200).send({ 'hub.challenge': challenge });
    } else {
      return response.sendStatus(403);
    }
  }

  /**
   * Strava webhook handler (POST)
   */
  @Post('strava/webhook')
  async stravaWebhookPost(
    @Body()
    body: {
      object_id: number;
      owner_id: number;
      aspect_type: 'create' | 'delete';
    },
  ) {
    await this.stravaProviderService.handleWebhook(body);
  }
}
