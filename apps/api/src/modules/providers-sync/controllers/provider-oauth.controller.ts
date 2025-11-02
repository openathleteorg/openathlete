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

import { StravaProviderService } from '../providers/strava.provider.service';

@Controller('provider')
export class ProviderOAuthController {
  constructor(
    private readonly stravaProviderService: StravaProviderService,
    // Add other provider services here when implemented
  ) {}

  /**
   * Get OAuth authorization URI for a provider
   */
  @Get(':provider/uri')
  getAuthorizationUri(@Param('provider') provider: string) {
    const providerEnum = provider.toUpperCase() as connector_provider;

    switch (providerEnum) {
      case connector_provider.STRAVA:
        return { uri: this.stravaProviderService.getAuthorizationUri() };
      // Add other providers here
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
    @Body('code') code: string,
  ) {
    const providerEnum = provider.toUpperCase() as connector_provider;

    switch (providerEnum) {
      case connector_provider.STRAVA:
        return this.stravaProviderService.connect(user, code);
      // Add other providers here
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  /**
   * Strava webhook verification (GET)
   */
  @Get('strava/webhook')
  async stravaWebhookGet(@Req() request: Request, @Res() response: Response) {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    if (
      mode === 'subscribe' &&
      token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
    ) {
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
