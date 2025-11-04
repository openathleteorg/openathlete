import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { connector_provider, provider_account } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import {
  BaseProviderService,
  OAuthConfig,
} from '../base/base-provider.service';

@Injectable()
export class SuuntoProviderService extends BaseProviderService {
  protected readonly provider = connector_provider.SUUNTO;

  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: 'https://cloud.suunto.com/api/oauth/authorize',
      tokenUrl: 'https://cloud.suunto.com/api/oauth/token',
      clientId: this.configService.get('SUUNTO_CLIENT_ID') || '',
      clientSecret: this.configService.get('SUUNTO_CLIENT_SECRET') || '',
      redirectUri: this.configService.get('SUUNTO_REDIRECT_URI') || '',
      scopes: ['read', 'write'], // Suunto scopes for workout export
    };
  }

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    super(prisma, configService);
  }
}


