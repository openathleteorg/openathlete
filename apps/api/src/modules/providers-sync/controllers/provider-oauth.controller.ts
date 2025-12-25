import { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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

import { connector_provider, event_type } from '@openathlete/database';
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
  @Post(':provider/token')
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
  @Post(':provider/disconnect')
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
        console.error('Failed to delete Garmin user registration:', error);
      }
    }

    // For Suunto, call deauthorize API before revoking
    if (providerEnum === connector_provider.SUUNTO && account.access_token) {
      try {
        await this.suuntoProviderService.deauthorize(account.access_token);
      } catch (error) {
        // Log error but continue with revocation
        // Token might already be expired or invalid
        console.error('Failed to deauthorize Suunto:', error);
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
  @Patch(':provider/preferences')
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
  @Post(':provider/import-all')
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
  async garminHealthPingWebhook(
    @Body() body: GarminHealthPingPayload | undefined,
  ) {
    await this.garminProviderService.handleHealthPingWebhook(body);
    return { success: true };
  }

  @Post('garmin/webhook/activity-files')
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

  /**
   * Test endpoint: Simulate Polar webhook
   * POST /provider/polar/webhook/test
   * Body: { event: 'EXERCISE' | 'SLEEP' | 'ACTIVITY_SUMMARY', user_id: number, entity_id?: string, skip_signature?: boolean }
   *
   * Example:
   * curl -X POST http://localhost:3000/api/provider/polar/webhook/test \
   *   -H "Content-Type: application/json" \
   *   -d '{"event": "EXERCISE", "user_id": 63661436, "entity_id": "test-exercise-123"}'
   */
  @Post('polar/webhook/test')
  async testPolarWebhook(
    @Body()
    body: {
      event: PolarWebhookPayload['event'];
      user_id: number;
      entity_id?: string;
      skip_signature?: boolean;
    },
  ) {
    this.logger.log(
      `[TEST] Simulating Polar webhook: event=${body.event}, user_id=${body.user_id}`,
    );

    const payload: PolarWebhookPayload = {
      event: body.event,
      user_id: body.user_id,
      entity_id: body.entity_id,
      timestamp: new Date().toISOString(),
      url: body.entity_id
        ? `https://www.polaraccesslink.com/v3/exercises/${body.entity_id}`
        : undefined,
    };

    // Generate signature if secret key is available and not skipped
    let signature: string | undefined;
    if (!body.skip_signature) {
      const secretKey = this.configService.get('POLAR_WEBHOOK_SECRET_KEY');
      if (secretKey) {
        const crypto = await import('crypto');
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(JSON.stringify(payload));
        signature = hmac.digest('hex');
        this.logger.debug(`[TEST] Generated webhook signature: ${signature}`);
      } else {
        this.logger.warn(
          '[TEST] POLAR_WEBHOOK_SECRET_KEY not configured, skipping signature',
        );
      }
    } else {
      this.logger.debug(
        '[TEST] Skipping signature verification (skip_signature=true)',
      );
    }

    try {
      await this.polarProviderService.handleWebhook(payload, signature);
      return {
        success: true,
        message: `Polar webhook ${body.event} processed successfully`,
        payload,
      };
    } catch (error) {
      this.logger.error(
        `[TEST] Polar webhook test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Test endpoint: Trigger manual import for Polar account
   * POST /provider/polar/test/import
   * Body: { athlete_id: number }
   *
   * Example:
   * curl -X POST http://localhost:3000/api/provider/polar/test/import \
   *   -H "Content-Type: application/json" \
   *   -d '{"athlete_id": 1}'
   */
  @Post('polar/test/import')
  async testPolarImport(@Body() body: { athlete_id: number }) {
    this.logger.log(
      `[TEST] Triggering manual Polar import for athlete ${body.athlete_id}`,
    );

    const account = await this.prisma.provider_account.findFirst({
      where: {
        athlete_id: body.athlete_id,
        provider: connector_provider.POLAR,
        status: 'active',
      },
    });

    if (!account) {
      throw new BadRequestException(
        `No active Polar account found for athlete ${body.athlete_id}`,
      );
    }

    try {
      const result = await this.polarProviderService.queueFullImport(account);
      return {
        success: true,
        message: 'Polar import triggered successfully',
        result,
      };
    } catch (error) {
      this.logger.error(
        `[TEST] Polar import test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  @Delete('test/activities/:userId')
  async deleteAllActivitiesForUser(@Param('userId') userId: string) {
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return { success: false, error: 'Invalid user ID' };
    }

    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: userIdNum },
      include: {
        events: {
          where: {
            type: event_type.ACTIVITY,
          },
          select: {
            event_id: true,
          },
        },
      },
    });

    if (!athlete) {
      return { success: false, error: 'Athlete not found for user' };
    }

    const eventIds = athlete.events.map((e) => e.event_id);

    if (eventIds.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: `No activities found for user ${userIdNum}`,
      };
    }

    await this.prisma.event_activity_weather.deleteMany({
      where: { event_activity: { event_id: { in: eventIds } } },
    });

    await this.prisma.event_activity_normalization_factor.deleteMany({
      where: {
        normalization: { event_activity: { event_id: { in: eventIds } } },
      },
    });

    await this.prisma.event_activity_normalization.deleteMany({
      where: { event_activity: { event_id: { in: eventIds } } },
    });

    await this.prisma.record.deleteMany({
      where: { event_activity: { event_id: { in: eventIds } } },
    });

    await this.prisma.event_activity.deleteMany({
      where: { event_id: { in: eventIds } },
    });

    await this.prisma.event.deleteMany({
      where: { event_id: { in: eventIds } },
    });

    return {
      success: true,
      deletedCount: eventIds.length,
      message: `Deleted ${eventIds.length} activities for user ${userIdNum}`,
    };
  }
}
