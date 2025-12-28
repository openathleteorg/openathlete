import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConnectorProvider } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { BaseProviderService, OAuthConfig } from '../base';

@Injectable()
export class CorosProviderService extends BaseProviderService {
  protected readonly provider = ConnectorProvider.COROS;

  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: 'https://open.coros.com/oauth2/authorize',
      tokenUrl: 'https://open.coros.com/oauth2/token',
      clientId: this.configService.get('COROS_CLIENT_ID') || '',
      clientSecret: this.configService.get('COROS_CLIENT_SECRET') || '',
      redirectUri: this.configService.get('COROS_REDIRECT_URI') || '',
      scopes: ['workout'], // Coros scopes for workout export
    };
  }

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    super(prisma, configService);
  }
}
