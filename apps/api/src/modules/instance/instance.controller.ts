import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ConnectorProvider } from '@openathlete/database';
import { ApiEnvSchemaType, InstanceInfoDto } from '@openathlete/shared';

import { OidcService } from '../auth/services/oidc.service';
import { emailTransportKind } from '../notification/services/email-transport.service';
import { PrismaService } from '../prisma/services/prisma.service';
import { configuredProviders } from '../providers-sync/base/provider-config';

@ApiTags('Instance')
@Controller('instance')
export class InstanceController {
  constructor(
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
    private readonly prisma: PrismaService,
    private readonly oidc: OidcService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'What this instance offers',
    description:
      'Public. Which optional services are configured: Google sign-in, email, and the device connectors users can connect, and who can create an account. The app hides the rest. Says nothing about how they are configured.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        googleSignIn: { type: 'boolean' },
        email: { type: 'boolean' },
        garminPersonalApi: { type: 'boolean' },
        providers: {
          type: 'array',
          items: { type: 'string', enum: Object.values(ConnectorProvider) },
        },
        oidc: {
          type: 'object',
          nullable: true,
          properties: { name: { type: 'string' } },
          description:
            'Sign-in through an OpenID Connect provider, and its name',
        },
        signup: {
          type: 'string',
          enum: ['open', 'invite', 'closed'],
          description:
            'SIGNUP_MODE, except open while the instance has no account',
        },
      },
    },
  })
  async getInstanceInfo(): Promise<InstanceInfoDto> {
    const get = (key: keyof ApiEnvSchemaType) => this.config.get(key);
    const mode = this.config.get('SIGNUP_MODE') ?? 'open';
    return {
      googleSignIn: !!get('FIREBASE_SERVICE_ACCOUNT_JSON'),
      email: !!emailTransportKind(get),
      providers: configuredProviders(get),
      garminPersonalApi: get('GARMIN_PERSONAL_API_ENABLED') === true,
      // The first account is always allowed: it is the administrator's
      signup:
        mode !== 'open' && (await this.prisma.user.count()) === 0
          ? 'open'
          : mode,
      oidc: this.oidc.info(),
    };
  }
}
