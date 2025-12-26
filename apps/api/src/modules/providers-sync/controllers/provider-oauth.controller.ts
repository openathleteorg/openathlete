import { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
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

import { connector_provider } from '@openathlete/database';
import type { ApiEnvSchemaType } from '@openathlete/shared';
import {
  ConnectorProvider,
  ProviderPreferencesDto,
  getProviderSyncCapabilities,
  providerPreferencesSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  GarminHealthPingPayload,
  PolarWebhookPayload,
  SuuntoWebhookPayload,
} from '../../core/types/connector';
import { FullImportResult } from '../base/base-provider.service';
import { CorosProviderService, SuuntoProviderService } from '../providers';
import { GarminProviderService } from '../providers/garmin.provider.service';
import { PolarProviderService } from '../providers/polar.provider.service';
import { StravaProviderService } from '../providers/strava.provider.service';

function toConnectorProvider(provider: connector_provider): ConnectorProvider {
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
  ) {}

  private async getAthleteForUser(user: AuthUser) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: user.user_id },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    return athlete;
  }

  private async getProviderAccountForUser(
    user: AuthUser,
    providerEnum: connector_provider,
  ) {
    const athlete = await this.getAthleteForUser(user);

    const account = await this.prisma.provider_account.findFirst({
      where: {
        athlete_id: athlete.athlete_id,
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
    enum: Object.values(connector_provider),
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
      case connector_provider.POLAR:
        return { uri: this.polarProviderService.getAuthorizationUri() };
      default:
        throw new Error(`Provider ${provider} not supported`);
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
    enum: Object.values(connector_provider),
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
          enum: Object.values(connector_provider),
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
    const providerEnum = provider.toUpperCase() as connector_provider;

    const athlete = await this.getAthleteForUser(user);

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
        return this.garminProviderService.connect(
          code,
          codeVerifier,
          athlete.athlete_id,
        );
      }
      case connector_provider.SUUNTO: {
        const tokenResponse =
          await this.suuntoProviderService.exchangeCodeForTokens(code);
        // Try to get user ID or username from token (JWT decode)
        // Prefer username as webhooks use username
        const externalUserId = await this.suuntoProviderService.getUserId(
          tokenResponse.access_token,
        );
        this.logger.log(
          `Suunto OAuth: Extracted external_user_id: ${externalUserId || 'none'}`,
        );
        return this.suuntoProviderService.saveProviderAccount({
          athleteId: athlete.athlete_id,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || '',
          expiresIn: tokenResponse.expires_in,
          scopes: tokenResponse.scope,
          externalUserId: externalUserId || undefined,
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
      case connector_provider.POLAR: {
        return this.polarProviderService.connect(code, athlete.athlete_id);
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
    enum: Object.values(connector_provider),
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
    const providerEnum = provider.toUpperCase() as connector_provider;

    const { account } = await this.getProviderAccountForUser(
      user,
      providerEnum,
    );

    // For Garmin, call deleteUserRegistration API before revoking
    if (providerEnum === connector_provider.GARMIN && account.access_token) {
      try {
        await this.garminProviderService.deleteUserRegistration(
          account.access_token,
        );
      } catch (error) {
        // Log error but continue with revocation
        // Token might already be expired or invalid
        this.logger.error(
          `Failed to delete Garmin user registration: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    // For Suunto, call deauthorize API before revoking
    if (providerEnum === connector_provider.SUUNTO && account.access_token) {
      try {
        await this.suuntoProviderService.deauthorize(account.access_token);
      } catch (error) {
        // Log error but continue with revocation
        // Token might already be expired or invalid
        this.logger.error(
          `Failed to deauthorize Suunto: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
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
            enum: Object.values(connector_provider),
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
      importActivitiesEnabled: account.import_activities_enabled,
      exportWorkoutsEnabled: account.export_workouts_enabled,
      importMetricsEnabled: account.import_metrics_enabled,
      fullImportRequestedAt: account.full_import_requested_at,
      fullImportCompletedAt: account.full_import_completed_at,
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
    enum: Object.values(connector_provider),
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
    const providerEnum = provider.toUpperCase() as connector_provider;
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
      data.import_activities_enabled = body.importActivitiesEnabled;
    }

    if (body.exportWorkoutsEnabled !== undefined) {
      if (!capabilities.exportWorkouts) {
        throw new BadRequestException(
          `Exporting workouts is not available for ${provider}`,
        );
      }
      data.export_workouts_enabled = body.exportWorkoutsEnabled;
    }

    if (body.importMetricsEnabled !== undefined) {
      if (!capabilities.importMetrics) {
        throw new BadRequestException(
          `Importing metrics is not available for ${provider}`,
        );
      }
      data.import_metrics_enabled = body.importMetricsEnabled;
    }

    await this.prisma.provider_account.update({
      where: {
        provider_account_id: account.provider_account_id,
      },
      data,
    });

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
      'Initiates a full historical import of all activities from a connected provider. The import is queued and processed asynchronously. Only providers that support full import (Strava, Garmin, Polar, Suunto) can use this endpoint. Activity import must be enabled for the provider. If a full import is already in progress, the request will be rejected. If a full import was already completed, returns success without re-importing. Some providers may request a backfill, in which case the import completion date is set to null until backfill completes.',
  })
  @ApiParam({
    name: 'provider',
    type: String,
    enum: Object.values(connector_provider),
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
        queuedActivities: {
          type: 'number',
          description: 'Number of activities queued for import',
          example: 150,
        },
        backfillRequested: {
          type: 'boolean',
          description:
            'Whether a backfill was requested (import will complete later)',
          example: false,
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
    const providerEnum = provider.toUpperCase() as connector_provider;
    const { account } = await this.getProviderAccountForUser(
      user,
      providerEnum,
    );

    if (!account.import_activities_enabled) {
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

    if (account.full_import_completed_at) {
      return { success: true, message: 'Full import already completed' };
    }

    if (account.full_import_requested_at && !account.full_import_completed_at) {
      throw new BadRequestException(
        'A historical import is already in progress',
      );
    }

    const now = new Date();

    await this.prisma.provider_account.update({
      where: {
        provider_account_id: account.provider_account_id,
      },
      data: {
        full_import_requested_at: now,
        full_import_completed_at: null,
      },
    });

    try {
      let importResult: FullImportResult | null = null;
      switch (providerEnum) {
        case connector_provider.STRAVA:
          importResult =
            await this.stravaProviderService.queueFullImport(account);
          break;
        case connector_provider.GARMIN:
          importResult =
            await this.garminProviderService.queueFullImport(account);
          break;
        case connector_provider.POLAR:
          importResult =
            await this.polarProviderService.queueFullImport(account);
          break;
        case connector_provider.SUUNTO:
          importResult =
            await this.suuntoProviderService.queueFullImport(account);
          break;
        default:
          throw new BadRequestException(
            `Historical import is not available for ${provider}`,
          );
      }

      await this.prisma.provider_account.update({
        where: {
          provider_account_id: account.provider_account_id,
        },
        data: {
          full_import_completed_at:
            importResult?.backfillRequested === true ? null : new Date(),
        },
      });

      const queuedCount = importResult?.queuedActivities ?? 0;

      return {
        success: true,
        queuedActivities: queuedCount,
        backfillRequested: importResult?.backfillRequested ?? false,
      };
    } catch (error) {
      await this.prisma.provider_account.update({
        where: {
          provider_account_id: account.provider_account_id,
        },
        data: {
          full_import_requested_at: null,
        },
      });
      throw error;
    }
  }

  /**
   * Strava webhook verification (GET)
   */
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

    const verifyToken = process.env.STRAVA_WEBHOOK_TOKEN;
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

  @Post('garmin/webhook/activity-ping')
  @ApiOperation({
    summary: 'Garmin activity ping webhook',
    description:
      'Receives activity ping notifications from Garmin when new activities are available. Processes multiple activity pings in a batch. Each ping contains a userId and callbackURL. The webhook triggers activity import for the corresponding Garmin account. Invalid pings (missing userId or callbackURL) are skipped without failing the entire batch.',
  })
  @ApiBody({
    description: 'Garmin activity ping payload',
    schema: {
      type: 'object',
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'Garmin user ID',
                example: 'garmin-user-123',
              },
              callbackURL: {
                type: 'string',
                format: 'uri',
                description: 'URL to fetch activity data from',
                example: 'https://connectapi.garmin.com/...',
              },
            },
          },
        },
      },
      required: ['activities'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Activity pings processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid payload or missing activities array',
  })
  async garminActivityPingWebhook(@Body() body: unknown) {
    const payload = body as {
      activities?: Array<{ userId?: string; callbackURL?: string }>;
    };

    if (!payload.activities || !Array.isArray(payload.activities)) {
      return {
        success: false,
        error: 'Invalid payload: missing activities array',
      };
    }

    for (const activityPing of payload.activities) {
      const userId = activityPing.userId;
      const callbackURL = activityPing.callbackURL;

      if (!userId || !callbackURL) {
        continue;
      }

      try {
        await this.garminProviderService.handleActivityPingWebhook({
          userId,
          callbackURL,
        });
      } catch {
        // Continue processing other pings even if one fails
      }
    }

    return { success: true };
  }

  @Post('garmin/webhook/health-ping')
  @ApiOperation({
    summary: 'Garmin health ping webhook',
    description:
      "Receives health ping notifications from Garmin. Health pings are used to verify the webhook endpoint is operational and to receive health-related data updates. The payload structure may vary based on Garmin's webhook configuration.",
  })
  @ApiBody({
    description: 'Garmin health ping payload',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Garmin user ID',
          example: 'garmin-user-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Health ping processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async garminHealthPingWebhook(
    @Body() body: GarminHealthPingPayload | undefined,
  ) {
    await this.garminProviderService.handleHealthPingWebhook(body);
    return { success: true };
  }

  @Post('garmin/webhook/activity-files')
  @ApiOperation({
    summary: 'Garmin activity files webhook',
    description:
      'Receives notifications from Garmin when activity files (FIT or GPX) are available for download. Processes multiple file notifications in a batch. Only FIT and GPX file types are processed. Each notification includes activity metadata (ID, name, type, device, start time) and a callbackURL to download the file. Invalid notifications (missing required fields) are skipped without failing the entire batch.',
  })
  @ApiBody({
    description: 'Garmin activity files webhook payload',
    schema: {
      type: 'object',
      properties: {
        activityFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'Garmin user ID',
                example: 'garmin-user-123',
              },
              summaryId: {
                type: 'string',
                description: 'Activity summary ID',
                example: 'summary-123',
              },
              fileType: {
                type: 'string',
                enum: ['FIT', 'GPX'],
                description: 'File type (only FIT and GPX are processed)',
                example: 'FIT',
              },
              callbackURL: {
                type: 'string',
                format: 'uri',
                description: 'URL to download the activity file',
                example: 'https://connectapi.garmin.com/...',
              },
              activityType: {
                type: 'string',
                description: 'Type of activity',
                example: 'running',
              },
              deviceName: {
                type: 'string',
                description: 'Device name that recorded the activity',
                example: 'Forerunner 945',
              },
              startTimeInSeconds: {
                type: 'number',
                description: 'Activity start time (Unix timestamp)',
                example: 1704067200,
              },
              activityId: {
                type: 'number',
                description: 'Garmin activity ID',
                example: 123456789,
              },
              activityName: {
                type: 'string',
                description: 'Activity name',
                example: 'Morning Run',
              },
              manual: {
                type: 'boolean',
                description: 'Whether activity was manually entered',
                example: false,
              },
              activityDescription: {
                type: 'string',
                nullable: true,
                description: 'Activity description',
                example: 'Easy recovery run',
              },
            },
            required: ['userId', 'callbackURL', 'fileType', 'activityId'],
          },
        },
      },
      required: ['activityFiles'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Activity files webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid payload or missing activityFiles array',
  })
  async garminActivityFilesWebhook(@Body() body: unknown) {
    const payload = body as {
      activityFiles?: Array<{
        userId?: string;
        summaryId?: string;
        fileType?: string;
        callbackURL?: string;
        activityType?: string;
        deviceName?: string;
        startTimeInSeconds?: number;
        activityId?: number;
        activityName?: string;
        manual?: boolean;
        activityDescription?: string;
      }>;
    };

    if (!payload.activityFiles || !Array.isArray(payload.activityFiles)) {
      return {
        success: false,
        error: 'Invalid payload: missing activityFiles array',
      };
    }

    for (const filePing of payload.activityFiles) {
      const userId = filePing.userId;
      const callbackURL = filePing.callbackURL;
      const fileType = filePing.fileType;
      const activityId = filePing.activityId;

      if (!userId || !callbackURL || !fileType || !activityId) {
        continue;
      }

      if (fileType !== 'FIT' && fileType !== 'GPX') {
        continue;
      }

      try {
        await this.garminProviderService.handleActivityFilePingWebhook({
          userId,
          summaryId: filePing.summaryId || '',
          fileType: fileType as 'FIT' | 'GPX',
          callbackURL,
          activityType: filePing.activityType || '',
          deviceName: filePing.deviceName || '',
          startTimeInSeconds: filePing.startTimeInSeconds || 0,
          activityId,
          activityName: filePing.activityName || '',
          manual: filePing.manual || false,
          activityDescription: filePing.activityDescription,
        });
      } catch {
        // Continue processing other files even if one fails
      }
    }

    return { success: true };
  }

  @Post('garmin/webhook/deregistration')
  @ApiOperation({
    summary: 'Garmin user deregistration webhook',
    description:
      'Receives notifications from Garmin when a user deregisters their account from Garmin Connect. This webhook is triggered when a user disconnects their Garmin account from the Garmin Connect platform. The system should handle this by marking the provider account as revoked.',
  })
  @ApiBody({
    description: 'Garmin deregistration webhook payload',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Garmin user ID being deregistered',
          example: 'garmin-user-123',
        },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Deregistration webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async garminDeregistrationWebhook(
    @Body()
    body: {
      userId: string;
    },
  ) {
    await this.garminProviderService.handleDeregistrationWebhook(body);
    return { success: true };
  }

  @Post('garmin/webhook/user-permissions-change')
  @ApiOperation({
    summary: 'Garmin user permissions change webhook',
    description:
      'Receives notifications from Garmin when a user changes their permissions or revokes access to the application. This webhook is triggered when permissions are modified in Garmin Connect settings. The system should handle this by updating the provider account status accordingly.',
  })
  @ApiBody({
    description: 'Garmin permissions change webhook payload',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Garmin user ID',
          example: 'garmin-user-123',
        },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated permissions list',
          example: ['activity.read', 'health.read'],
        },
      },
      required: ['userId', 'permissions'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions change webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async garminUserPermissionsChangeWebhook(
    @Body()
    body: {
      userId: string;
      permissions: string[];
    },
  ) {
    await this.garminProviderService.handleUserPermissionsChangeWebhook(body);
    return { success: true };
  }

  /**
   * Polar webhook handler (POST)
   * Handles all Polar webhook events (EXERCISE, SLEEP, etc.)
   */
  @Post('polar/webhook')
  @ApiOperation({
    summary: 'Polar webhook event handler',
    description:
      "Receives and processes webhook events from Polar AccessLink. Handles multiple event types: EXERCISE (new activity available), SLEEP (sleep data available), ACTIVITY_SUMMARY (activity summary data), CONTINUOUS_HEART_RATE (heart rate data). The webhook signature is verified using the polar-webhook-signature header. Events are processed based on the account's import preferences (activities, metrics). Only events matching enabled import types are processed.",
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
            'CONTINUOUS_HEART_RATE',
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
      required: ['event', 'user_id'],
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
    @Req() request: { headers: Record<string, string | string[]> },
  ) {
    this.logger.log(
      `Received Polar webhook request: event=${body.event}, user_id=${body.user_id}`,
    );

    // Extract signature from headers (can be string or string[])
    const signatureHeader = request.headers['polar-webhook-signature'];
    const signature =
      typeof signatureHeader === 'string'
        ? signatureHeader
        : Array.isArray(signatureHeader)
          ? signatureHeader[0]
          : undefined;

    const eventHeader = request.headers['polar-webhook-event'];
    const event =
      typeof eventHeader === 'string'
        ? eventHeader
        : Array.isArray(eventHeader)
          ? eventHeader[0]
          : undefined;

    this.logger.debug(
      `Polar webhook headers - Event: ${event}, Signature: ${signature ? 'present' : 'missing'}`,
    );

    try {
      await this.polarProviderService.handleWebhook(body, signature);
      this.logger.log(
        `Polar webhook processed successfully: event=${body.event}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Polar webhook processing failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Suunto webhook handler (POST)
   * Handles workout notifications from Suunto
   * Webhook URL: POST /provider/suunto/webhook
   */
  @Post('suunto/webhook')
  @ApiOperation({
    summary: 'Suunto webhook event handler',
    description:
      "Receives and processes webhook events from Suunto. Handles two types of events: workout notifications (when a new workout is available) and 247 Data API webhooks (for metrics data). Workout webhooks require a workoutKey to identify the workout. 247 webhooks are prefixed with 'SUUNTO_247_' and are handled separately. Invalid webhooks (missing workoutKey for workout events) return an error response.",
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
          example: '247 webhook processed',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - missing workoutKey for workout events or processing error',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'string',
          example: 'Missing workoutKey in webhook payload',
        },
      },
    },
  })
  async suuntoWebhook(@Body() body: unknown) {
    this.logger.log(`Received Suunto webhook request: ${JSON.stringify(body)}`);

    const payload = body as SuuntoWebhookPayload;
    const eventType = payload.type;

    // Handle 247 Data API webhooks (metrics) - these are handled by the service
    if (eventType?.startsWith('SUUNTO_247_')) {
      try {
        await this.suuntoProviderService.handleWebhook(payload);
        return { success: true, message: '247 webhook processed' };
      } catch (error) {
        this.logger.error(
          `Error processing Suunto 247 webhook: ${error instanceof Error ? error.message : String(error)}`,
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Handle workout webhooks
    const workoutKey = payload.workout?.workoutKey || payload.workoutKey;
    if (!workoutKey) {
      this.logger.warn(
        `Suunto webhook missing workoutKey. Payload: ${JSON.stringify(payload)}`,
      );
      return {
        success: false,
        error: 'Missing workoutKey in webhook payload',
      };
    }

    try {
      await this.suuntoProviderService.handleWebhook(payload);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error processing Suunto webhook: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
