import { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  RawBodyRequest,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { ConnectorProvider } from '@openathlete/database';
import type { ApiEnvSchemaType } from '@openathlete/shared';
import {
  ProviderPreferencesDto,
  getProviderSyncCapabilities,
  isFullImportInProgress,
  providerPreferencesSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { QueueService } from 'src/modules/queue/queue.service';

import {
  PolarWebhookPayload,
  SuuntoWebhookPayload,
} from '../../core/types/connector';
import { configuredProviders } from '../base/provider-config';
import { CorosProviderService, SuuntoProviderService } from '../providers';
import { GarminProviderService } from '../providers/garmin.provider.service';
import { PolarProviderService } from '../providers/polar.provider.service';
import { StravaProviderService } from '../providers/strava.provider.service';

function toConnectorProvider(provider: ConnectorProvider): ConnectorProvider {
  return provider as unknown as ConnectorProvider;
}

@ApiTags('Provider')
@Controller('provider')
export class ProviderOAuthController {
  private readonly logger = new Logger(ProviderOAuthController.name);

  constructor(
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    private readonly stravaProviderService: StravaProviderService,
    private readonly garminProviderService: GarminProviderService,
    private readonly suuntoProviderService: SuuntoProviderService,
    private readonly corosProviderService: CorosProviderService,
    private readonly polarProviderService: PolarProviderService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
  ) {}

  private async getAthleteForUser(user: AuthUser) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: user.userId },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    return athlete;
  }

  private async getProviderAccountForUser(
    user: AuthUser,
    providerEnum: ConnectorProvider,
  ) {
    const athlete = await this.getAthleteForUser(user);

    const account = await this.prisma.providerAccount.findFirst({
      where: {
        athleteId: athlete.athleteId,
        provider: providerEnum,
        status: 'active',
      },
    });

    if (!account) {
      throw new Error('Provider account not found');
    }

    return { athlete, account };
  }

  /**
   * Get OAuth authorization URI for a provider
   * For Garmin (PKCE), also returns code_verifier that must be sent back during token exchange
   */
  @Get(':provider/uri')
  @ApiOperation({
    summary: 'Get OAuth authorization URI for a provider',
    description:
      'Generates the OAuth authorization URI for connecting a fitness provider account. Supported providers: STRAVA, GARMIN, SUUNTO, COROS, POLAR. For Garmin (which uses PKCE flow), also returns a code_verifier that must be securely stored by the client and sent back during token exchange. The client should redirect the user to the returned URI to initiate the OAuth flow.',
  })
  @ApiParam({
    name: 'provider',
    type: String,
    enum: Object.values(ConnectorProvider),
    description: 'Provider name (case-insensitive)',
    example: 'strava',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URI generated successfully',
    schema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          format: 'uri',
          example: 'https://www.strava.com/oauth/authorize?client_id=...',
          description: 'OAuth authorization URL to redirect user to',
        },
        codeVerifier: {
          type: 'string',
          nullable: true,
          description:
            'PKCE code verifier (only for Garmin). Must be stored securely and sent back during token exchange.',
          example: 'abc123def456...',
        },
      },
      required: ['uri'],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - provider not supported',
  })
  @ApiResponse({
    status: 503,
    description:
      'PROVIDER_NOT_CONFIGURED - the connector is not set up on this instance',
  })
  getAuthorizationUri(@Param('provider') provider: string) {
    const providerEnum = provider.toUpperCase() as ConnectorProvider;
    this.assertConfigured(providerEnum);

    switch (providerEnum) {
      case ConnectorProvider.STRAVA:
        return { uri: this.stravaProviderService.getAuthorizationUri() };
      case ConnectorProvider.GARMIN:
        // Garmin uses PKCE - return both URI and code_verifier
        // Client must store code_verifier and send it back during token exchange
        // Note: In production, code_verifier should be stored server-side (session/Redis)
        // For now, returning it to client - they must store it securely and send it back
        return this.garminProviderService.getAuthorizationUriWithPKCE();
      case ConnectorProvider.SUUNTO:
        return { uri: this.suuntoProviderService.getAuthorizationUri() };
      case ConnectorProvider.COROS:
        return { uri: this.corosProviderService.getAuthorizationUri() };
      case ConnectorProvider.POLAR:
        return { uri: this.polarProviderService.getAuthorizationUri() };
      default:
        throw new BadRequestException(`Provider ${provider} not supported`);
    }
  }

  /**
   * Without its client settings a connector would send the user to the
   * provider with an empty client_id: refuse it up front.
   */
  private assertConfigured(provider: ConnectorProvider) {
    const configured = configuredProviders((key) =>
      this.configService.get(key),
    );
    if (!configured.includes(provider)) {
      throw new ServiceUnavailableException('PROVIDER_NOT_CONFIGURED');
    }
  }

  /**
   * Exchange OAuth code for tokens and save provider account
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':provider/token')
  @ApiOperation({
    summary: 'Connect provider account via OAuth',
    description:
      "Exchanges the OAuth authorization code for access and refresh tokens, then saves the provider account linked to the authenticated user's athlete profile. For Garmin (PKCE flow), the codeVerifier parameter is required and must match the one returned during authorization URI generation. Each provider has specific handling: Strava extracts athlete information, Garmin uses PKCE verification, Suunto extracts external user ID from JWT token, Coros and Polar use standard OAuth flows.",
  })
  @ApiParam({
    name: 'provider',
    type: String,
    enum: Object.values(ConnectorProvider),
    description: 'Provider name (case-insensitive)',
    example: 'strava',
  })
  @ApiBody({
    description: 'OAuth token exchange data',
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'OAuth authorization code received from provider',
          example: 'abc123def456...',
        },
        codeVerifier: {
          type: 'string',
          description:
            'PKCE code verifier (required for Garmin, optional for others)',
          example: 'xyz789uvw012...',
        },
      },
      required: ['code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Provider account connected successfully',
    schema: {
      type: 'object',
      properties: {
        providerAccountId: { type: 'number', example: 1 },
        provider: {
          type: 'string',
          enum: Object.values(ConnectorProvider),
          example: 'STRAVA',
        },
        status: { type: 'string', example: 'active' },
        athleteId: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - provider not supported, codeVerifier missing for Garmin, or invalid OAuth code',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found for user',
  })
  async connectProvider(
    @JwtUser() user: AuthUser,
    @Param('provider') provider: string,
    @Body() body: { code: string; codeVerifier?: string },
  ) {
    const { code } = body;
    const providerEnum = provider.toUpperCase() as ConnectorProvider;

    const athlete = await this.getAthleteForUser(user);

    switch (providerEnum) {
      case ConnectorProvider.STRAVA:
        return this.stravaProviderService.connect(user, code);
      case ConnectorProvider.GARMIN: {
        // Garmin PKCE requires code_verifier
        const codeVerifier = body.codeVerifier;
        if (!codeVerifier) {
          throw new Error(
            'codeVerifier is required for Garmin OAuth (PKCE flow)',
          );
        }
        return this.garminProviderService.connect(
          code,
          codeVerifier,
          athlete.athleteId,
        );
      }
      case ConnectorProvider.SUUNTO: {
        const tokenResponse =
          await this.suuntoProviderService.exchangeCodeForTokens(code);
        // Try to get user ID or username from token (JWT decode)
        // Prefer username as webhooks use username
        const externalUserId = await this.suuntoProviderService.getUserId(
          tokenResponse.access_token,
        );
        this.logger.log(
          `Suunto OAuth: Extracted external_userId: ${externalUserId || 'none'}`,
        );
        return this.suuntoProviderService.saveProviderAccount({
          athleteId: athlete.athleteId,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || '',
          expiresIn: tokenResponse.expires_in,
          scopes: tokenResponse.scope,
          externalUserId: externalUserId || undefined,
        });
      }
      case ConnectorProvider.COROS: {
        const tokenResponse =
          await this.corosProviderService.exchangeCodeForTokens(code);
        return this.corosProviderService.saveProviderAccount({
          athleteId: athlete.athleteId,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || '',
          expiresIn: tokenResponse.expires_in,
          scopes: tokenResponse.scope,
        });
      }
      case ConnectorProvider.POLAR: {
        return this.polarProviderService.connect(code, athlete.athleteId);
      }
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  /**
   * Disconnect a provider account
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':provider/disconnect')
  @ApiOperation({
    summary: 'Disconnect provider account',
    description:
      "Disconnects a connected provider account by revoking access and marking the account as revoked. For Garmin, calls the deleteUserRegistration API before revoking. For Suunto, calls the deauthorize API before revoking. The provider account status is updated to 'revoked' instead of being deleted, preserving historical data.",
  })
  @ApiParam({
    name: 'provider',
    type: String,
    enum: Object.values(ConnectorProvider),
    description: 'Provider name (case-insensitive)',
    example: 'strava',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider account disconnected successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Disconnected from strava',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - provider account not found for user',
  })
  async disconnectProvider(
    @JwtUser() user: AuthUser,
    @Param('provider') provider: string,
  ) {
    const providerEnum = provider.toUpperCase() as ConnectorProvider;

    const { account } = await this.getProviderAccountForUser(
      user,
      providerEnum,
    );

    // Garmin must stop sending this user's data: deregister them there
    if (providerEnum === ConnectorProvider.GARMIN) {
      await this.garminProviderService.disconnect(account);
      return { success: true, message: `Disconnected from ${provider}` };
    }

    // For Suunto, call deauthorize API before revoking
    if (providerEnum === ConnectorProvider.SUUNTO && account.accessToken) {
      try {
        await this.suuntoProviderService.deauthorize(account.accessToken);
      } catch (error) {
        // Log error but continue with revocation
        // Token might already be expired or invalid
        this.logger.error(
          `Failed to deauthorize Suunto: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    if (providerEnum === ConnectorProvider.POLAR) {
      await this.polarProviderService.disconnect(account);
    }

    // Update status to revoked instead of deleting
    await this.prisma.providerAccount.update({
      where: {
        providerAccountId: account.providerAccountId,
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
  @ApiBearerAuth()
  @Get('connected')
  @ApiOperation({
    summary: 'Get all connected provider accounts',
    description:
      "Retrieves a list of all active provider accounts connected to the authenticated user's athlete profile. Returns provider information including connection status, preferences (import/export settings), and full import status.",
  })
  @ApiResponse({
    status: 200,
    description: 'List of connected providers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: Object.values(ConnectorProvider),
            example: 'STRAVA',
          },
          status: {
            type: 'string',
            example: 'active',
            description: 'Account status (active, revoked, etc.)',
          },
          connectedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: 'When the account was connected',
          },
          importActivitiesEnabled: {
            type: 'boolean',
            example: true,
            description: 'Whether activity import is enabled',
          },
          exportWorkoutsEnabled: {
            type: 'boolean',
            example: false,
            description: 'Whether workout export is enabled',
          },
          importMetricsEnabled: {
            type: 'boolean',
            example: false,
            description: 'Whether metrics import is enabled',
          },
          fullImportRequestedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2024-01-01T00:00:00.000Z',
            description: 'When full historical import was requested',
          },
          fullImportCompletedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2024-01-02T00:00:00.000Z',
            description: 'When full historical import was completed',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  async getConnectedProviders(@JwtUser() user: AuthUser) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: user.userId },
      include: {
        providerAccounts: {
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!athlete) {
      return [];
    }

    return athlete.providerAccounts.map((account) => ({
      provider: account.provider,
      status: account.status,
      connectedAt: account.createdAt,
      importActivitiesEnabled: account.importActivitiesEnabled,
      exportWorkoutsEnabled: account.exportWorkoutsEnabled,
      importMetricsEnabled: account.importMetricsEnabled,
      fullImportRequestedAt: account.fullImportRequestedAt,
      fullImportCompletedAt: account.fullImportCompletedAt,
    }));
  }

  /**
   * Update provider synchronization preferences
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':provider/preferences')
  @ApiOperation({
    summary: 'Update provider synchronization preferences',
    description:
      "Updates the synchronization preferences for a connected provider account. Only provided fields will be updated. The preferences are validated against the provider's capabilities (e.g., not all providers support exporting workouts or importing metrics). At least one preference must be provided.",
  })
  @ApiParam({
    name: 'provider',
    type: String,
    enum: Object.values(ConnectorProvider),
    description: 'Provider name (case-insensitive)',
    example: 'strava',
  })
  @ApiBody({
    description: 'Provider preferences to update',
    schema: {
      type: 'object',
      properties: {
        importActivitiesEnabled: {
          type: 'boolean',
          description: 'Enable/disable automatic activity import from provider',
          example: true,
        },
        exportWorkoutsEnabled: {
          type: 'boolean',
          description:
            'Enable/disable workout export to provider (not all providers support this)',
          example: false,
        },
        importMetricsEnabled: {
          type: 'boolean',
          description:
            'Enable/disable metrics import from provider (not all providers support this)',
          example: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Provider preferences updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - feature not available for provider, no preferences provided, or invalid provider',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - provider account not found for user',
  })
  async updateProviderPreferences(
    @JwtUser() user: AuthUser,
    @Param('provider') provider: string,
    @Body(new ZodValidationPipe(providerPreferencesSchema))
    body: ProviderPreferencesDto,
  ) {
    const providerEnum = provider.toUpperCase() as ConnectorProvider;
    const { account } = await this.getProviderAccountForUser(
      user,
      providerEnum,
    );

    const connectorProviderKey = toConnectorProvider(providerEnum);
    const capabilities = getProviderSyncCapabilities(connectorProviderKey);

    const data: Record<string, unknown> = {};

    if (body.importActivitiesEnabled !== undefined) {
      if (!capabilities.importActivities) {
        throw new BadRequestException(
          `Importing activities is not available for ${provider}`,
        );
      }
      data.importActivitiesEnabled = body.importActivitiesEnabled;
    }

    if (body.exportWorkoutsEnabled !== undefined) {
      if (!capabilities.exportWorkouts) {
        throw new BadRequestException(
          `Exporting workouts is not available for ${provider}`,
        );
      }
      data.exportWorkoutsEnabled = body.exportWorkoutsEnabled;
    }

    if (body.importMetricsEnabled !== undefined) {
      if (!capabilities.importMetrics) {
        throw new BadRequestException(
          `Importing metrics is not available for ${provider}`,
        );
      }
      data.importMetricsEnabled = body.importMetricsEnabled;
    }

    await this.prisma.providerAccount.update({
      where: {
        providerAccountId: account.providerAccountId,
      },
      data,
    });

    // Polar sends webhooks for new data only: fetch the days it already has
    if (
      providerEnum === ConnectorProvider.POLAR &&
      body.importMetricsEnabled === true
    ) {
      await this.queueService.addPolarMetricsJob(account.providerAccountId, 0);
    }

    return { success: true };
  }

  /**
   * Trigger historical import for a provider
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':provider/import-all')
  @ApiOperation({
    summary: 'Trigger full historical activity import',
    description:
      'Queues a full historical import of all activities from a connected provider and returns immediately: the worker lists the history and imports activities progressively, and fullImportCompletedAt is set once every activity is queued. Only providers that support full import (Strava, Garmin, Suunto) can use this endpoint. Activity import must be enabled for the provider. If a full import is already in progress (requested less than 24 hours ago), the request is rejected. If a full import was already completed, returns success without re-importing. Some providers may request a backfill, in which case the import completion date is set to null until backfill completes.',
  })
  @ApiParam({
    name: 'provider',
    type: String,
    enum: Object.values(ConnectorProvider),
    description: 'Provider name (case-insensitive). Must support full import.',
    example: 'strava',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical import triggered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        queued: {
          type: 'boolean',
          description:
            'The import was queued; the worker lists the history and imports activities progressively',
          example: true,
        },
        message: {
          type: 'string',
          nullable: true,
          description: 'Informational message (e.g., if already completed)',
          example: 'Full import already completed',
        },
      },
      required: ['success'],
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - activity import disabled, provider does not support full import, or import already in progress',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - provider account not found for user',
  })
  async importAllActivities(
    @JwtUser() user: AuthUser,
    @Param('provider') provider: string,
  ) {
    const providerEnum = provider.toUpperCase() as ConnectorProvider;
    const { account } = await this.getProviderAccountForUser(
      user,
      providerEnum,
    );

    if (!account.importActivitiesEnabled) {
      throw new BadRequestException(
        `Importing activities is disabled for ${provider}`,
      );
    }

    const connectorProviderKey = toConnectorProvider(providerEnum);
    const capabilities = getProviderSyncCapabilities(connectorProviderKey);

    if (!capabilities.supportsFullImport || !capabilities.importActivities) {
      throw new BadRequestException(
        `Historical import is not available for ${provider}`,
      );
    }

    if (account.fullImportCompletedAt) {
      return { success: true, message: 'Full import already completed' };
    }

    if (isFullImportInProgress(account)) {
      throw new BadRequestException(
        'A historical import is already in progress',
      );
    }

    // Listing the whole history can take minutes: the worker does it
    await this.prisma.providerAccount.update({
      where: { providerAccountId: account.providerAccountId },
      data: { fullImportRequestedAt: new Date(), fullImportCompletedAt: null },
    });
    try {
      await this.queueService.addFullImportJob(account.providerAccountId);
    } catch (error) {
      await this.prisma.providerAccount.update({
        where: { providerAccountId: account.providerAccountId },
        data: { fullImportRequestedAt: null },
      });
      throw error;
    }

    return { success: true, queued: true };
  }

  /**
   * Strava webhook verification (GET)
   */
  @SkipThrottle()
  @Get('strava/webhook')
  @ApiOperation({
    summary: 'Strava webhook verification',
    description:
      "Handles Strava webhook subscription verification (GET request). Strava sends a GET request with hub.mode='subscribe', hub.verify_token, and hub.challenge to verify the webhook endpoint. Returns the challenge if the verify token matches the configured STRAVA_WEBHOOK_TOKEN.",
  })
  @ApiQuery({
    name: 'hub.mode',
    type: String,
    description: 'Webhook mode (should be "subscribe")',
    example: 'subscribe',
  })
  @ApiQuery({
    name: 'hub.verify_token',
    type: String,
    description: 'Verification token from Strava',
    example: 'your-verify-token',
  })
  @ApiQuery({
    name: 'hub.challenge',
    type: String,
    description: 'Challenge string from Strava to echo back',
    example: 'challenge-string-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook verified successfully',
    schema: {
      type: 'object',
      properties: {
        'hub.challenge': {
          type: 'string',
          example: 'challenge-string-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - verification token mismatch',
  })
  async stravaWebhookGet(@Req() request: Request, @Res() response: Response) {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];
    this.logger.log(
      `Strava webhook verification: mode=${mode}, token=${token}, challenge=${challenge}, STRAVA_WEBHOOK_TOKEN=${this.configService.get('STRAVA_WEBHOOK_TOKEN')}`,
    );

    const verifyToken = this.configService.get('STRAVA_WEBHOOK_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return response.status(200).send({ 'hub.challenge': challenge });
    } else {
      return response.sendStatus(403);
    }
  }

  /**
   * Strava webhook handler (POST)
   */
  @SkipThrottle()
  @Post('strava/webhook')
  @ApiOperation({
    summary: 'Strava webhook event handler',
    description:
      'Receives and processes webhook events from Strava. Handles activity creation and deletion events. When an activity is created, it triggers an import if activity import is enabled for the connected account. The webhook payload includes the activity object_id, owner_id, and aspect_type (create or delete).',
  })
  @ApiBody({
    description: 'Strava webhook payload',
    schema: {
      type: 'object',
      properties: {
        object_id: {
          type: 'number',
          description: 'Strava activity ID',
          example: 123456789,
        },
        owner_id: {
          type: 'number',
          description: 'Strava athlete ID',
          example: 987654321,
        },
        aspect_type: {
          type: 'string',
          enum: ['create', 'delete'],
          description: 'Type of event (create or delete)',
          example: 'create',
        },
      },
      required: ['object_id', 'owner_id', 'aspect_type'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook event processed successfully',
  })
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

  /**
   * Garmin notifications. Garmin posts each summary type (activities,
   * activity files, dailies, sleeps..., deregistrations and permission
   * changes) to the URL set for it in its endpoint configuration tool; all
   * of these routes accept any of them. Data notifications are queued and
   * the 200 goes out at once: Garmin gives up after 30 seconds.
   */
  @SkipThrottle()
  @Post([
    'garmin/webhook',
    'garmin/webhook/activity-ping',
    'garmin/webhook/health-ping',
    'garmin/webhook/activity-files',
    'garmin/webhook/deregistration',
    'garmin/webhook/user-permissions-change',
  ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Garmin notification webhook',
    description:
      'Receives Garmin ping and push notifications of every summary type, as { "<summaryType>": [entries] }. Pings carry a callbackURL that the worker pulls; pushes carry the data. Deregistrations and user permission changes are applied immediately. Answers 200 once the notifications are queued.',
  })
  @ApiBody({
    description: 'Garmin notification body',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            callbackURL: { type: 'string', format: 'uri' },
          },
        },
      },
      example: {
        activities: [
          {
            userId: '4aacafe82427c251df9c9592d0c06768',
            callbackURL:
              'https://apis.garmin.com/wellness-api/rest/activities?uploadStartTimeInSeconds=1444937651&uploadEndTimeInSeconds=1444937902&token=XXXX',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Notifications accepted' })
  async garminWebhook(@Body() body: unknown) {
    await this.garminProviderService.handleWebhook(body);
    return { success: true };
  }

  /**
   * Polar webhook handler (POST)
   * Handles all Polar webhook events (EXERCISE, SLEEP, etc.)
   */
  @SkipThrottle()
  // Polar counts any other status as a failure, 201 included: it then refuses
  // to create the webhook, and turns it off after 7 days
  @HttpCode(HttpStatus.OK)
  @Post('polar/webhook')
  @ApiOperation({
    summary: 'Polar webhook event handler',
    description:
      "Receives and processes webhook events from Polar AccessLink. Handles multiple event types: EXERCISE (new activity available), SLEEP (sleep data available), ACTIVITY_SUMMARY (activity summary data), PHYSICAL_INFORMATION (weight, heart rate settings). The webhook signature is verified using the polar-webhook-signature header. Events are processed based on the account's import preferences (activities, metrics). Only events matching enabled import types are processed.",
  })
  @ApiBody({
    description: 'Polar webhook payload',
    schema: {
      type: 'object',
      properties: {
        event: {
          type: 'string',
          enum: [
            'EXERCISE',
            'SLEEP',
            'ACTIVITY_SUMMARY',
            'PHYSICAL_INFORMATION',
            'PING',
          ],
          description: 'Type of Polar webhook event',
          example: 'EXERCISE',
        },
        user_id: {
          type: 'number',
          description: 'Polar user ID',
          example: 63661436,
        },
        entity_id: {
          type: 'string',
          nullable: true,
          description: 'Entity ID (e.g., exercise ID for EXERCISE events)',
          example: '123456789',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Event timestamp',
          example: '2024-01-01T00:00:00.000Z',
        },
        url: {
          type: 'string',
          format: 'uri',
          nullable: true,
          description: 'URL to fetch entity data from Polar API',
          example: 'https://www.polaraccesslink.com/v3/exercises/123456789',
        },
      },
      required: ['event'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Polar webhook event processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid payload or signature verification failed',
  })
  async polarWebhook(
    @Body() body: PolarWebhookPayload,
    @Req() request: RawBodyRequest<Request>,
    @Headers('polar-webhook-signature') signature?: string,
  ) {
    await this.polarProviderService.handleWebhook(
      body,
      request.rawBody,
      signature,
    );
    return { success: true };
  }

  /**
   * Suunto webhook handler (POST)
   * Handles workout notifications from Suunto
   * Webhook URL: POST /provider/suunto/webhook
   */
  @SkipThrottle()
  @Post('suunto/webhook')
  @ApiOperation({
    summary: 'Suunto webhook event handler',
    description:
      "Receives Suunto notifications, verifies their signature and queues the work, since Suunto waits 2 seconds for the answer: a new workout is imported, and 24/7 notifications (types prefixed with 'SUUNTO_247_') sync the days they cover. Other notifications, such as new routes, are acknowledged and ignored.",
  })
  @ApiBody({
    description: 'Suunto webhook payload',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Event type (workout event or SUUNTO_247_* for metrics)',
          example: 'workout',
        },
        workoutKey: {
          type: 'string',
          nullable: true,
          description: 'Suunto workout key (required for workout events)',
          example: 'workout-123-abc',
        },
        workout: {
          type: 'object',
          nullable: true,
          properties: {
            workoutKey: {
              type: 'string',
              example: 'workout-123-abc',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Suunto webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          nullable: true,
          example: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'The X-HMAC-SHA256-Signature header does not match the body (checked when SUUNTO_WEBHOOK_SECRET is set)',
  })
  async suuntoWebhook(
    @Body() body: unknown,
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-hmac-sha256-signature') signature?: string,
  ) {
    if (
      !this.suuntoProviderService.verifyWebhookSignature(
        request.rawBody,
        signature,
      )
    ) {
      this.logger.warn('Suunto webhook rejected: invalid signature');
      throw new UnauthorizedException('Invalid signature');
    }
    // The work is queued: a failure here (Redis down) is worth a retry
    await this.suuntoProviderService.handleWebhook(
      (body ?? {}) as SuuntoWebhookPayload,
    );
    return { success: true };
  }
}
