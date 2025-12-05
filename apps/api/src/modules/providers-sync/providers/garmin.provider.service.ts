import axios, { isAxiosError } from 'axios';
import Redis from 'ioredis';
import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  Prisma,
  activity_segment_type,
  connector_provider,
  event_activity,
  event_type,
  metric_type,
  provider_account,
} from '@openathlete/database';
import {
  ActivityStream,
  ApiEnvSchemaType,
  METRIC_TYPE,
} from '@openathlete/shared';

import { calculateSegmentMetrics } from '../../core/helpers/activity-segment';
import { compressActivityStream } from '../../core/helpers/activity-stream';
import { mapGarminActivityType } from '../../core/helpers/garmin';
import {
  FitFileSegment,
  parseFitFile,
  parseGpxFile,
} from '../../core/helpers/garmin-file-parser';
import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundEnergy,
  roundHeartrate,
  roundMetricValue,
  roundSpeed,
} from '../../core/helpers/round-activity-values';
import {
  GarminActivityFilePingWebhook,
  GarminActivityPingWebhook,
  GarminActivitySummary,
  GarminBloodPressureSummary,
  GarminBodyCompositionSummary,
  GarminDailySummary,
  GarminDeregistrationWebhook,
  GarminHealthPingPayload,
  GarminHealthSnapshotSummary,
  GarminHealthSummaryType,
  GarminHrvSummary,
  GarminPulseOxSummary,
  GarminRespirationSummary,
  GarminSkinTempSummary,
  GarminSleepSummary,
  GarminStressDetailsSummary,
  GarminUserMetricsSummary,
  GarminUserPermissionsChangeWebhook,
} from '../../core/types/connector';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import {
  BaseProviderService,
  FullImportResult,
  OAuthConfig,
  OAuthTokenResponse,
} from '../base/base-provider.service';
import {
  ImportOptions,
  ImportedActivity,
  ProviderImportCapability,
} from '../base/provider-import.interface';

type MetricRecord = {
  type: METRIC_TYPE;
  date: Date;
  value: number;
};

@Injectable()
export class GarminProviderService
  extends BaseProviderService
  implements ProviderImportCapability, OnModuleInit
{
  protected readonly provider = connector_provider.GARMIN;
  private readonly importWindowMs = 30 * 24 * 60 * 60 * 1000;

  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: 'https://connect.garmin.com/oauth2Confirm',
      tokenUrl: 'https://diauth.garmin.com/di-oauth2-service/oauth/token',
      clientId: this.configService.get('GARMIN_CLIENT_ID') || '',
      clientSecret: this.configService.get('GARMIN_CLIENT_SECRET') || '',
      redirectUri: this.configService.get('GARMIN_REDIRECT_URI') || '',
      scopes: [],
    };
  }

  private redis: Redis | null = null;

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
  ) {
    super(prisma, configService);
  }

  async onModuleInit() {
    await this.initRedis();
  }

  private async initRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        this.redis = new Redis({
          host: 'localhost',
          port: 6379,
          maxRetriesPerRequest: null,
        });
      } else {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.redis = null;
    }
  }

  private generatePKCE(): { verifier: string; challenge: string } {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
  }

  getAuthorizationUriWithPKCE(state?: string): {
    uri: string;
    codeVerifier: string;
  } {
    const { verifier, challenge } = this.generatePKCE();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.oauthConfig.clientId,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      ...(this.oauthConfig.redirectUri && {
        redirect_uri: this.oauthConfig.redirectUri,
      }),
      ...(state && { state }),
    });
    return {
      uri: `${this.oauthConfig.authorizationUrl}?${params.toString()}`,
      codeVerifier: verifier,
    };
  }

  override getAuthorizationUri(state?: string): string {
    const { challenge } = this.generatePKCE();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.oauthConfig.clientId,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      ...(this.oauthConfig.redirectUri && {
        redirect_uri: this.oauthConfig.redirectUri,
      }),
      ...(state && { state }),
    });
    return `${this.oauthConfig.authorizationUrl}?${params.toString()}`;
  }

  override async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string,
  ): Promise<OAuthTokenResponse> {
    if (!codeVerifier) {
      throw new Error(
        'PKCE code_verifier is required for Garmin OAuth token exchange',
      );
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.oauthConfig.clientId,
      client_secret: this.oauthConfig.clientSecret,
      code,
      code_verifier: codeVerifier,
      ...(this.oauthConfig.redirectUri && {
        redirect_uri: this.oauthConfig.redirectUri,
      }),
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
  }

  override async refreshAccessToken(
    refreshToken: string,
  ): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.oauthConfig.clientId,
      client_secret: this.oauthConfig.clientSecret,
      refresh_token: refreshToken,
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
  }

  async getUserId(accessToken: string): Promise<string> {
    try {
      const { data } = await axios.get<{ userId: string }>(
        'https://apis.garmin.com/wellness-api/rest/user/id',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return data.userId;
    } catch (error) {
      if (
        isAxiosError(error) &&
        (error.response?.status === 404 ||
          error.response?.data?.errorType === 'partner_registration_not_found')
      ) {
        return '';
      }
      throw error;
    }
  }

  async getUserPermissions(accessToken: string): Promise<string[]> {
    try {
      const { data } = await axios.get<unknown>(
        'https://apis.garmin.com/wellness-api/rest/user/permissions',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (Array.isArray(data)) {
        return data;
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'permissions' in data &&
        Array.isArray((data as { permissions: unknown }).permissions)
      ) {
        return (data as { permissions: string[] }).permissions;
      }

      return [];
    } catch (error) {
      if (
        isAxiosError(error) &&
        (error.response?.status === 404 ||
          error.response?.data?.errorType === 'partner_registration_not_found')
      ) {
        return [];
      }
      throw error;
    }
  }

  async deleteUserRegistration(accessToken: string): Promise<void> {
    await axios.delete(
      'https://apis.garmin.com/wellness-api/rest/user/registration',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  override async saveProviderAccount(params: {
    athleteId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
    scopes?: string;
    externalUserId?: string;
  }): Promise<provider_account> {
    const adjustedExpiresIn = params.expiresIn
      ? Math.max(0, params.expiresIn - 600)
      : undefined;

    return super.saveProviderAccount({
      ...params,
      expiresIn: adjustedExpiresIn,
    });
  }

  override async getValidAccessToken(
    account: provider_account,
  ): Promise<string> {
    if (
      account.access_token &&
      account.expires_at &&
      new Date() < account.expires_at
    ) {
      return account.access_token;
    }

    if (!account.refresh_token) {
      throw new Error(`No refresh token available for ${this.provider}`);
    }

    const tokenResponse = await this.refreshAccessToken(account.refresh_token);
    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + (tokenResponse.expires_in - 600) * 1000)
      : null;

    await this.prisma.provider_account.update({
      where: {
        provider_account_id: account.provider_account_id,
      },
      data: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token ?? account.refresh_token,
        expires_at: expiresAt,
      },
    });

    return tokenResponse.access_token;
  }

  async connect(
    code: string,
    codeVerifier: string,
    athleteId: number,
  ): Promise<provider_account> {
    const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);
    const userId = await this.getUserId(tokenResponse.access_token);

    const account = await this.saveProviderAccount({
      athleteId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || '',
      expiresIn: tokenResponse.expires_in,
      scopes: tokenResponse.scope,
      externalUserId: userId,
    });

    return account;
  }

  private async isUserRegistrationComplete(
    account: provider_account,
  ): Promise<boolean> {
    try {
      const accessToken = await this.getValidAccessToken(account);
      const userId = await this.getUserId(accessToken);
      return !!userId;
    } catch {
      return false;
    }
  }

  private async hasActivityExportPermission(
    account: provider_account,
  ): Promise<boolean | null> {
    try {
      const accessToken = await this.getValidAccessToken(account);
      const permissions = await this.getUserPermissions(accessToken);
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return null;
      }
      return permissions.includes('ACTIVITY_EXPORT');
    } catch {
      return null;
    }
  }

  async queueFullImport(account: provider_account): Promise<FullImportResult> {
    const hasPermission = await this.hasActivityExportPermission(account);
    if (hasPermission === false) {
      throw new BadRequestException(
        'Garmin does not allow exporting activities for this account. Please re-authorize with activity access enabled.',
      );
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - this.importWindowMs);

    try {
      const accessToken = await this.getValidAccessToken(account);
      const summaryStartTime = Math.floor(startDate.getTime() / 1000);
      const summaryEndTime = Math.floor(endDate.getTime() / 1000);

      const response = await axios.get(
        'https://apis.garmin.com/wellness-api/rest/backfill/activities',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            summaryStartTimeInSeconds: summaryStartTime,
            summaryEndTimeInSeconds: summaryEndTime,
          },
          timeout: 15000,
        },
      );
      if (response.status === 202) {
        return {
          queuedActivities: 0, // Will be processed via ping/push notifications
          backfillRequested: true,
        };
      }

      throw new Error(
        `Unexpected backfill response status: ${response.status}`,
      );
    } catch {
      const activities = await this.importActivities(account, {
        startDate,
        endDate,
      });

      if (activities.length === 0) {
        const isComplete = await this.isUserRegistrationComplete(account);
        if (!isComplete) {
          setTimeout(() => {
            this.queueFullImport(account).catch(() => {});
          }, 5000);
          return { queuedActivities: 0 };
        }
      }

      const queued = await this.enqueueActivities(account, activities);

      return {
        queuedActivities: queued,
        backfillRequested: false,
      };
    }
  }

  private async makeAuthenticatedRequest<T>(
    account: provider_account,
    requestFn: (accessToken: string) => Promise<T>,
  ): Promise<T> {
    let accessToken = await this.getValidAccessToken(account);

    try {
      return await requestFn(accessToken);
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.status === 401 &&
        account.refresh_token
      ) {
        const tokenResponse = await this.refreshAccessToken(
          account.refresh_token,
        );
        const expiresAt = tokenResponse.expires_in
          ? new Date(Date.now() + (tokenResponse.expires_in - 600) * 1000)
          : null;

        const updatedAccount = await this.prisma.provider_account.update({
          where: {
            provider_account_id: account.provider_account_id,
          },
          data: {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token ?? account.refresh_token,
            expires_at: expiresAt,
          },
        });

        account.access_token = updatedAccount.access_token;
        account.refresh_token = updatedAccount.refresh_token;
        account.expires_at = updatedAccount.expires_at;

        accessToken = tokenResponse.access_token;
        return await requestFn(accessToken);
      }
      throw error;
    }
  }

  async importActivities(
    account: provider_account,
    options?: ImportOptions,
  ): Promise<ImportedActivity[]> {
    const hasPermission = await this.hasActivityExportPermission(account);
    if (hasPermission === false) {
      return [];
    }

    const limit = options?.limit ?? Number.POSITIVE_INFINITY;
    const activities: ImportedActivity[] = [];

    const endTime = options?.endDate
      ? Math.floor(options.endDate.getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const startTime = options?.startDate
      ? Math.floor(options.startDate.getTime() / 1000)
      : endTime - 30 * 24 * 60 * 60;

    if (startTime >= endTime) {
      return [];
    }

    const chunkSize = 24 * 60 * 60;
    let currentStart = startTime;

    while (activities.length < limit && currentStart < endTime) {
      const currentEnd = Math.min(currentStart + chunkSize, endTime);

      const data = await this.makeAuthenticatedRequest<GarminActivitySummary[]>(
        account,
        async (accessToken) => {
          try {
            const response = await axios.get<GarminActivitySummary[]>(
              'https://apis.garmin.com/wellness-api/rest/activities',
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                params: {
                  uploadStartTimeInSeconds: currentStart,
                  uploadEndTimeInSeconds: currentEnd,
                },
                timeout: 15000,
              },
            );
            return response.data;
          } catch (error) {
            if (
              isAxiosError(error) &&
              (error.response?.status === 403 || error.response?.status === 400)
            ) {
              return [];
            }
            throw error;
          }
        },
      );

      if (data.length === 0) {
        currentStart = currentEnd;
        continue;
      }

      for (const activity of data) {
        if (activities.length >= limit) break;

        const startDate = new Date(
          (activity.startTimeInSeconds + activity.startTimeOffsetInSeconds) *
            1000,
        );
        const endDate = new Date(
          startDate.getTime() + activity.durationInSeconds * 1000,
        );

        if (options?.startDate && startDate < options.startDate) continue;
        if (options?.endDate && startDate > options.endDate) continue;

        activities.push({
          externalId: String(activity.activityId),
          name: activity.activityName,
          startDate,
          endDate,
          sport: mapGarminActivityType(activity.activityType),
          distance: activity.distanceInMeters,
          duration: activity.durationInSeconds,
          raw: activity,
        });
      }

      currentStart = currentEnd;
    }

    return activities;
  }

  private async enqueueActivities(
    account: provider_account,
    activities: ImportedActivity[],
  ): Promise<number> {
    if (activities.length === 0) {
      return 0;
    }

    const existingExternalIds = await this.prisma.event_activity.findMany({
      where: {
        external_id: {
          in: activities.map((a) => a.externalId),
        },
      },
      select: {
        external_id: true,
      },
    });

    const existingIdsSet = new Set(
      existingExternalIds.map((a) => a.external_id),
    );

    const newActivities = activities.filter(
      (a) => !existingIdsSet.has(a.externalId),
    );

    if (newActivities.length === 0) {
      this.logger.log(
        `No new Garmin activities to queue for account ${account.provider_account_id}`,
      );
      return 0;
    }

    await this.queueService.addActivityImportJobs(account, newActivities, true);
    return newActivities.length;
  }

  async importActivity(
    account: provider_account,
    activity: ImportedActivity,
  ): Promise<event_activity> {
    const existing = await this.prisma.event_activity.findFirst({
      where: {
        external_id: activity.externalId,
      },
    });

    if (existing) {
      return existing;
    }

    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: account.athlete_id },
      select: { athlete_id: true },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    const event = await this.prisma.event.create({
      data: {
        athlete_id: athlete.athlete_id,
        name: activity.name,
        type: event_type.ACTIVITY,
        start_date: activity.startDate,
        end_date: activity.endDate,
      },
    });

    const garminActivity = activity.raw as GarminActivitySummary;
    const savedActivity = await this.fetchGarminActivityData(
      event,
      garminActivity,
    );

    const pendingFile = await this.getPendingFile(activity.externalId);
    if (pendingFile) {
      await this.processActivityFile(
        account,
        savedActivity,
        pendingFile.callbackURL,
        pendingFile.fileType as 'FIT' | 'GPX',
      );
    }

    return savedActivity;
  }

  private async fetchGarminActivityData(
    event: { event_id: number },
    activity: GarminActivitySummary,
  ): Promise<event_activity> {
    const activityStream: ActivityStream = {};

    const summary = activity;
    const compressedActivityStream = compressActivityStream(activityStream);
    const sport = mapGarminActivityType(summary.activityType);

    let averageCadence: number | undefined;
    if (summary.averageBikeCadenceInRoundsPerMinute !== undefined) {
      averageCadence =
        roundCadence(summary.averageBikeCadenceInRoundsPerMinute) ?? undefined;
    } else if (summary.averageRunCadenceInStepsPerMinute !== undefined) {
      averageCadence =
        roundCadence(summary.averageRunCadenceInStepsPerMinute) ?? undefined;
    } else if (summary.averageSwimCadenceInStrokesPerMinute !== undefined) {
      averageCadence =
        roundCadence(summary.averageSwimCadenceInStrokesPerMinute) ?? undefined;
    }

    const movingTime = summary.durationInSeconds;

    const savedActivity = await this.prisma.event_activity.create({
      data: {
        provider: connector_provider.GARMIN,
        distance: roundDistance(summary.distanceInMeters || 0),
        elevation_gain: roundElevation(summary.totalElevationGainInMeters || 0),
        moving_time: movingTime,
        average_speed:
          roundSpeed(summary.averageSpeedInMetersPerSecond || 0) ?? 0,
        max_speed: roundSpeed(summary.maxSpeedInMetersPerSecond || 0) ?? 0,
        average_cadence: averageCadence,
        average_heartrate: roundHeartrate(
          summary.averageHeartRateInBeatsPerMinute,
        ),
        max_heartrate: roundHeartrate(summary.maxHeartRateInBeatsPerMinute),
        kilojoules: summary.activeKilocalories
          ? roundEnergy(summary.activeKilocalories * 4.184)
          : undefined,
        sport,
        stream: compressedActivityStream as object,
        external_id: activity.activityId.toString(),
        event: {
          connect: {
            event_id: event.event_id,
          },
        },
      },
    });

    return savedActivity;
  }

  async handleActivityPingWebhook(
    payload: GarminActivityPingWebhook,
  ): Promise<void> {
    const account = await this.prisma.provider_account.findFirst({
      where: {
        provider: connector_provider.GARMIN,
        external_user_id: payload.userId,
        status: 'active',
      },
      include: {
        athlete: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!account || !account.athlete || !account.athlete.user) {
      return;
    }

    if (!account.import_activities_enabled) {
      this.logger.debug(
        `Import disabled for Garmin account ${account.provider_account_id}, skipping activity ping`,
      );
      return;
    }

    try {
      const accessToken = await this.getValidAccessToken(account);

      const response = await axios.get<GarminActivitySummary[]>(
        payload.callbackURL,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 30000,
        },
      );

      const activities = response.data || [];
      if (activities.length === 0) {
        return;
      }

      const activityIds = activities.map((a) => String(a.activityId));
      const existingExternalIds = await this.prisma.event_activity.findMany({
        where: {
          external_id: {
            in: activityIds,
          },
        },
        select: {
          external_id: true,
        },
      });

      const existingIdsSet = new Set(
        existingExternalIds.map((a) => a.external_id),
      );

      const newActivities: ImportedActivity[] = activities
        .filter((a) => !existingIdsSet.has(String(a.activityId)))
        .map((activity) => {
          const startDate = new Date(
            (activity.startTimeInSeconds + activity.startTimeOffsetInSeconds) *
              1000,
          );
          const endDate = new Date(
            startDate.getTime() + activity.durationInSeconds * 1000,
          );

          return {
            externalId: String(activity.activityId),
            name: activity.activityName,
            startDate,
            endDate,
            sport: mapGarminActivityType(activity.activityType),
            raw: activity,
          };
        });

      if (newActivities.length === 0) {
        return;
      }

      await this.queueService.addActivityImportJobs(
        account,
        newActivities,
        false,
      );
    } catch {
      // Webhook should return 200 even if processing fails
    }
  }

  private async storePendingFile(
    activityId: string,
    payload: GarminActivityFilePingWebhook,
  ): Promise<void> {
    if (!this.redis) {
      await this.initRedis();
    }
    if (!this.redis) return;

    const key = `garmin:file:${activityId}`;
    await this.redis.setex(
      key,
      3600,
      JSON.stringify({
        callbackURL: payload.callbackURL,
        userId: payload.userId,
        fileType: payload.fileType,
      }),
    );
  }

  private async getPendingFile(
    activityId: string,
  ): Promise<{ callbackURL: string; userId: string; fileType: string } | null> {
    if (!this.redis) {
      await this.initRedis();
    }
    if (!this.redis) return null;

    const key = `garmin:file:${activityId}`;
    const data = await this.redis.get(key);
    if (!data) return null;

    await this.redis.del(key);
    return JSON.parse(data);
  }

  async handleHealthPingWebhook(
    payload: GarminHealthPingPayload | undefined,
  ): Promise<void> {
    if (!payload) {
      return;
    }

    // Process callbacks asynchronously after returning HTTP 200
    // This is required by Garmin to avoid timeouts
    setImmediate(() => {
      this.processHealthPingPayload(payload).catch((error) => {
        this.logger.error(
          `Failed to process Garmin health ping payload: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    });
  }

  private async processHealthPingPayload(
    payload: GarminHealthPingPayload,
  ): Promise<void> {
    const summaryTypes = Object.keys(payload) as GarminHealthSummaryType[];
    for (const summaryType of summaryTypes) {
      const notifications = payload[summaryType];
      if (!Array.isArray(notifications)) {
        continue;
      }

      for (const notification of notifications) {
        if (!notification?.userId || !notification.callbackURL) {
          continue;
        }

        const account = await this.prisma.provider_account.findFirst({
          where: {
            provider: connector_provider.GARMIN,
            external_user_id: notification.userId,
            status: 'active',
          },
        });

        if (!account) {
          continue;
        }

        if (!account.import_metrics_enabled) {
          this.logger.debug(
            `Metric import disabled for Garmin account ${account.provider_account_id}, skipping ${summaryType} summary`,
          );
          continue;
        }

        try {
          await this.processHealthSummary(
            account,
            summaryType,
            notification.callbackURL,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process Garmin ${summaryType} summary for account ${account.provider_account_id}`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    }
  }

  private async processHealthSummary(
    account: provider_account,
    summaryType: GarminHealthSummaryType,
    callbackURL: string,
  ): Promise<void> {
    switch (summaryType) {
      case 'dailies': {
        const data = await this.fetchHealthSummaries<GarminDailySummary>(
          account,
          callbackURL,
        );
        await this.saveMetrics(
          account.athlete_id,
          this.mapDailySummariesToMetrics(data),
        );
        break;
      }
      case 'sleeps': {
        const data = await this.fetchHealthSummaries<GarminSleepSummary>(
          account,
          callbackURL,
        );
        await this.saveMetrics(
          account.athlete_id,
          this.mapSleepSummariesToMetrics(data),
        );
        break;
      }
      case 'bodyComps': {
        const data =
          await this.fetchHealthSummaries<GarminBodyCompositionSummary>(
            account,
            callbackURL,
          );
        await this.saveMetrics(
          account.athlete_id,
          this.mapBodyCompSummariesToMetrics(data),
        );
        break;
      }
      case 'userMetrics': {
        const data = await this.fetchHealthSummaries<GarminUserMetricsSummary>(
          account,
          callbackURL,
        );
        await this.saveMetrics(
          account.athlete_id,
          this.mapUserMetricsSummariesToMetrics(data),
        );
        break;
      }
      case 'pulseox': {
        const data = await this.fetchHealthSummaries<GarminPulseOxSummary>(
          account,
          callbackURL,
        );
        await this.saveMetrics(
          account.athlete_id,
          this.mapPulseOxSummariesToMetrics(data),
        );
        break;
      }
      case 'allDayRespiration': {
        const data = await this.fetchHealthSummaries<GarminRespirationSummary>(
          account,
          callbackURL,
        );
        await this.saveMetrics(
          account.athlete_id,
          this.mapRespirationSummariesToMetrics(data),
        );
        break;
      }
      case 'healthSnapshot': {
        const data =
          await this.fetchHealthSummaries<GarminHealthSnapshotSummary>(
            account,
            callbackURL,
          );
        await this.saveMetrics(
          account.athlete_id,
          this.mapHealthSnapshotSummariesToMetrics(data),
        );
        break;
      }
      case 'hrv': {
        const data = await this.fetchHealthSummaries<GarminHrvSummary>(
          account,
          callbackURL,
        );
        await this.saveMetrics(
          account.athlete_id,
          this.mapHrvSummariesToMetrics(data),
        );
        break;
      }
      case 'bloodPressures': {
        const data =
          await this.fetchHealthSummaries<GarminBloodPressureSummary>(
            account,
            callbackURL,
          );
        await this.saveMetrics(
          account.athlete_id,
          this.mapBloodPressureSummariesToMetrics(data),
        );
        break;
      }
      case 'skinTemp': {
        const data = await this.fetchHealthSummaries<GarminSkinTempSummary>(
          account,
          callbackURL,
        );
        await this.saveMetrics(
          account.athlete_id,
          this.mapSkinTempSummariesToMetrics(data),
        );
        break;
      }
      case 'stressDetails': {
        const data =
          await this.fetchHealthSummaries<GarminStressDetailsSummary>(
            account,
            callbackURL,
          );
        await this.saveMetrics(
          account.athlete_id,
          this.mapStressDetailsSummariesToMetrics(data),
        );
        break;
      }
      case 'epochs': {
        // Epochs are 15-minute wellness data slices
        // We can skip processing epochs as they're already aggregated in dailies
        // But we'll log that we received them for debugging
        this.logger.debug(
          `Received epochs ping for account ${account.provider_account_id}, skipping (data aggregated in dailies)`,
        );
        break;
      }
      default:
        this.logger.warn(
          `Unhandled Garmin health summary type: ${summaryType}`,
        );
        break;
    }
  }

  private async fetchHealthSummaries<T>(
    account: provider_account,
    callbackURL: string,
  ): Promise<T[]> {
    return this.makeAuthenticatedRequest<T[]>(account, async (accessToken) => {
      try {
        const response = await axios.get<T[] | T>(callbackURL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 45000,
        });

        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data) {
          return [response.data as T];
        }
        return [];
      } catch {
        return [];
      }
    });
  }

  private async saveMetrics(
    athleteId: number,
    metrics: MetricRecord[],
  ): Promise<void> {
    const validMetrics = metrics.filter(
      (metric) =>
        metric.date instanceof Date &&
        !Number.isNaN(metric.date.getTime()) &&
        Number.isFinite(metric.value),
    );

    if (validMetrics.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      validMetrics.map((metric) =>
        this.prisma.athlete_metric.upsert({
          where: {
            athlete_id_type_date: {
              athlete_id: athleteId,
              type: metric.type as unknown as metric_type,
              date: metric.date,
            },
          },
          create: {
            athlete_id: athleteId,
            type: metric.type as unknown as metric_type,
            date: metric.date,
            value: roundMetricValue(metric.value),
          },
          update: {
            value: roundMetricValue(metric.value),
          },
        }),
      ),
    );
  }

  private mapDailySummariesToMetrics(
    summaries: GarminDailySummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date = this.parseCalendarDate(summary.calendarDate);
      if (!date) continue;

      const totalCalories =
        (summary.activeKilocalories ?? 0) + (summary.bmrKilocalories ?? 0);

      this.pushMetric(
        metrics,
        METRIC_TYPE.DAILY_CALORIES,
        date,
        totalCalories,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.DAILY_ACTIVE_CALORIES,
        date,
        summary.activeKilocalories,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.DAILY_BMR_CALORIES,
        date,
        summary.bmrKilocalories,
        0,
      );
      this.pushMetric(metrics, METRIC_TYPE.DAILY_STEPS, date, summary.steps, 0);
      this.pushMetric(
        metrics,
        METRIC_TYPE.DAILY_DISTANCE,
        date,
        this.metersToKilometers(summary.distanceInMeters),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.DAILY_ACTIVE_MINUTES,
        date,
        this.secondsToMinutes(summary.activeTimeInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.DAILY_MODERATE_MINUTES,
        date,
        this.secondsToMinutes(summary.moderateIntensityDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.DAILY_VIGOROUS_MINUTES,
        date,
        this.secondsToMinutes(summary.vigorousIntensityDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.DAILY_FLOORS,
        date,
        summary.floorsClimbed,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.HR_MIN_DAILY,
        date,
        summary.minHeartRateInBeatsPerMinute,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.HR_AVG_DAILY,
        date,
        summary.averageHeartRateInBeatsPerMinute,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.HR_MAX_DAILY,
        date,
        summary.maxHeartRateInBeatsPerMinute,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.HR_REST,
        date,
        summary.restingHeartRateInBeatsPerMinute,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.STRESS_AVERAGE,
        date,
        summary.averageStressLevel,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.STRESS_MAX,
        date,
        summary.maxStressLevel,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.STRESS_DURATION,
        date,
        this.secondsToMinutes(summary.stressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.STRESS_REST_DURATION,
        date,
        this.secondsToMinutes(summary.restStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.STRESS_ACTIVITY_DURATION,
        date,
        this.secondsToMinutes(summary.activityStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.STRESS_LOW_DURATION,
        date,
        this.secondsToMinutes(summary.lowStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.STRESS_MEDIUM_DURATION,
        date,
        this.secondsToMinutes(summary.mediumStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.STRESS_HIGH_DURATION,
        date,
        this.secondsToMinutes(summary.highStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.BODY_BATTERY_CHARGED,
        date,
        summary.bodyBatteryChargedValue,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.BODY_BATTERY_DRAINED,
        date,
        summary.bodyBatteryDrainedValue,
        0,
      );
    }

    return metrics;
  }

  private mapSleepSummariesToMetrics(
    summaries: GarminSleepSummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date = this.parseCalendarDate(summary.calendarDate);
      if (!date) continue;

      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_DURATION,
        date,
        this.secondsToHours(summary.durationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_REM_DURATION,
        date,
        this.secondsToHours(summary.remSleepInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_DEEP_DURATION,
        date,
        this.secondsToHours(summary.deepSleepDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_LIGHT_DURATION,
        date,
        this.secondsToHours(summary.lightSleepDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_AWAKE_DURATION,
        date,
        this.secondsToHours(summary.awakeDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.NAP_DURATION,
        date,
        this.secondsToHours(summary.totalNapDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_SCORE,
        date,
        summary.overallSleepScore?.value,
        0,
      );

      const respirationAvg = this.average(
        this.extractNumericValues(summary.timeOffsetSleepRespiration),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.SLEEP_RESPIRATION_AVG,
        date,
        respirationAvg,
      );

      const spo2Avg = this.average(
        this.extractNumericValues(summary.timeOffsetSleepSpo2),
      );
      this.pushMetric(metrics, METRIC_TYPE.SLEEP_SPO2_AVG, date, spo2Avg);
    }

    return metrics;
  }

  private mapBodyCompSummariesToMetrics(
    summaries: GarminBodyCompositionSummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date = this.dateFromTimestamp(
        summary.measurementTimeInSeconds,
        summary.measurementTimeOffsetInSeconds,
      );
      if (!date) continue;

      this.pushMetric(
        metrics,
        METRIC_TYPE.WEIGHT,
        date,
        this.gramsToKilograms(summary.weightInGrams),
      );
      this.pushMetric(metrics, METRIC_TYPE.BMI, date, summary.bodyMassIndex);
      this.pushMetric(
        metrics,
        METRIC_TYPE.BODY_FAT,
        date,
        summary.bodyFatInPercent,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.BODY_WATER,
        date,
        summary.bodyWaterInPercent,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.MUSCLE_MASS,
        date,
        this.gramsToKilograms(summary.muscleMassInGrams),
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.BONE_MASS,
        date,
        this.gramsToKilograms(summary.boneMassInGrams),
      );
    }

    return metrics;
  }

  private mapUserMetricsSummariesToMetrics(
    summaries: GarminUserMetricsSummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date = this.parseCalendarDate(summary.calendarDate);
      if (!date) continue;

      this.pushMetric(metrics, METRIC_TYPE.VO2MAX, date, summary.vo2Max);
      this.pushMetric(
        metrics,
        METRIC_TYPE.VO2MAX_CYCLING,
        date,
        summary.vo2MaxCycling,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.FITNESS_AGE,
        date,
        summary.fitnessAge,
        0,
      );
    }

    return metrics;
  }

  private mapPulseOxSummariesToMetrics(
    summaries: GarminPulseOxSummary[],
  ): MetricRecord[] {
    const stats = new Map<
      string,
      { sum: number; count: number; min: number }
    >();

    for (const summary of summaries) {
      const date =
        this.parseCalendarDate(summary.calendarDate) ??
        this.dateFromTimestamp(
          summary.startTimeInSeconds,
          summary.startTimeOffsetInSeconds,
        );
      if (!date) continue;

      const values = this.extractNumericValues(summary.timeOffsetSpo2Values);
      if (values.length === 0) continue;

      const key = date.toISOString();
      const current = stats.get(key) ?? {
        sum: 0,
        count: 0,
        min: Number.POSITIVE_INFINITY,
      };

      for (const value of values) {
        current.sum += value;
        current.count += 1;
        current.min = Math.min(current.min, value);
      }

      stats.set(key, current);
    }

    const metrics: MetricRecord[] = [];

    for (const [key, value] of stats.entries()) {
      if (value.count === 0) continue;
      const date = new Date(key);

      this.pushMetric(
        metrics,
        METRIC_TYPE.PULSE_OX_AVG,
        date,
        value.sum / value.count,
      );

      if (Number.isFinite(value.min)) {
        this.pushMetric(metrics, METRIC_TYPE.PULSE_OX_MIN, date, value.min);
      }
    }

    return metrics;
  }

  private mapRespirationSummariesToMetrics(
    summaries: GarminRespirationSummary[],
  ): MetricRecord[] {
    const stats = new Map<string, { sum: number; count: number }>();

    for (const summary of summaries) {
      const date = this.dateFromTimestamp(
        summary.startTimeInSeconds,
        summary.startTimeOffsetInSeconds,
      );
      if (!date) continue;

      const values = this.extractNumericValues(
        summary.timeOffsetEpochToBreaths,
      );
      if (values.length === 0) continue;

      const avg = this.average(values);
      if (avg === undefined) continue;

      const key = date.toISOString();
      const current = stats.get(key) ?? { sum: 0, count: 0 };
      current.sum += avg;
      current.count += 1;
      stats.set(key, current);
    }

    const metrics: MetricRecord[] = [];
    for (const [key, value] of stats.entries()) {
      if (value.count === 0) continue;
      const date = new Date(key);
      this.pushMetric(
        metrics,
        METRIC_TYPE.RESPIRATION_RATE_AVG,
        date,
        value.sum / value.count,
      );
    }
    return metrics;
  }

  private mapHealthSnapshotSummariesToMetrics(
    summaries: GarminHealthSnapshotSummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date =
        this.parseCalendarDate(summary.calendarDate) ??
        this.dateFromTimestamp(
          summary.startTimeInSeconds,
          summary.startTimeOffsetInSeconds,
        );
      if (!date) continue;

      for (const item of summary.summaries ?? []) {
        switch (item.summaryType) {
          case 'heart_rate':
            this.pushMetric(
              metrics,
              METRIC_TYPE.SNAPSHOT_HEART_RATE_AVG,
              date,
              item.avgValue,
            );
            break;
          case 'stress':
            this.pushMetric(
              metrics,
              METRIC_TYPE.SNAPSHOT_STRESS_AVG,
              date,
              item.avgValue,
            );
            break;
          case 'respiration':
            this.pushMetric(
              metrics,
              METRIC_TYPE.SNAPSHOT_RESPIRATION_AVG,
              date,
              item.avgValue,
            );
            break;
          case 'spo2':
            this.pushMetric(
              metrics,
              METRIC_TYPE.SNAPSHOT_SPO2_AVG,
              date,
              item.avgValue,
            );
            break;
          case 'rmssd_hrv':
            this.pushMetric(
              metrics,
              METRIC_TYPE.SNAPSHOT_RMSSD,
              date,
              item.avgValue,
            );
            break;
          case 'sdrr_hrv':
            this.pushMetric(
              metrics,
              METRIC_TYPE.SNAPSHOT_SDNN,
              date,
              item.avgValue,
            );
            break;
          default:
            break;
        }
      }
    }

    return metrics;
  }

  private mapHrvSummariesToMetrics(
    summaries: GarminHrvSummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date = this.parseCalendarDate(summary.calendarDate);
      if (!date) continue;

      this.pushMetric(
        metrics,
        METRIC_TYPE.HRV_LAST_NIGHT_AVG,
        date,
        summary.lastNightAvg,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.HRV_LAST_NIGHT_5MIN_HIGH,
        date,
        summary.lastNight5MinHigh,
      );
    }

    return metrics;
  }

  private mapBloodPressureSummariesToMetrics(
    summaries: GarminBloodPressureSummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date = this.dateFromTimestamp(
        summary.measurementTimeInSeconds,
        summary.measurementTimeOffsetInSeconds,
      );
      if (!date) continue;

      this.pushMetric(
        metrics,
        METRIC_TYPE.BLOOD_PRESSURE_SYSTOLIC,
        date,
        summary.systolic,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.BLOOD_PRESSURE_DIASTOLIC,
        date,
        summary.diastolic,
        0,
      );
      this.pushMetric(
        metrics,
        METRIC_TYPE.BLOOD_PRESSURE_PULSE,
        date,
        summary.pulse,
        0,
      );
    }

    return metrics;
  }

  private mapSkinTempSummariesToMetrics(
    summaries: GarminSkinTempSummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date = this.parseCalendarDate(summary.calendarDate);
      if (!date) continue;

      this.pushMetric(
        metrics,
        METRIC_TYPE.SKIN_TEMP_DEVIATION,
        date,
        summary.avgDeviationCelsius,
      );
    }

    return metrics;
  }

  private mapStressDetailsSummariesToMetrics(
    summaries: GarminStressDetailsSummary[],
  ): MetricRecord[] {
    const metrics: MetricRecord[] = [];

    for (const summary of summaries) {
      const date =
        this.parseCalendarDate(summary.calendarDate) ??
        this.dateFromTimestamp(
          summary.startTimeInSeconds,
          summary.startTimeOffsetInSeconds,
        );
      if (!date) continue;

      // Extract stress level values and calculate statistics
      const stressValues = this.extractNumericValues(
        summary.timeOffsetStressLevelValues,
      );
      if (stressValues.length > 0) {
        const validStressValues = stressValues.filter((v) => v > 0 && v <= 100);
        if (validStressValues.length > 0) {
          const avg = this.average(validStressValues);
          const max = Math.max(...validStressValues);
          if (avg !== undefined) {
            this.pushMetric(metrics, METRIC_TYPE.STRESS_AVERAGE, date, avg, 0);
          }
          if (Number.isFinite(max)) {
            this.pushMetric(metrics, METRIC_TYPE.STRESS_MAX, date, max, 0);
          }
        }
      }

      // Extract body battery values and calculate statistics
      const bodyBatteryValues = this.extractNumericValues(
        summary.timeOffsetBodyBatteryValues,
      );
      if (bodyBatteryValues.length > 0) {
        const validBatteryValues = bodyBatteryValues.filter(
          (v) => v >= 0 && v <= 100,
        );
        if (validBatteryValues.length > 0) {
          // Calculate charged/drained from changes in body battery
          let charged = 0;
          let drained = 0;
          for (let i = 1; i < validBatteryValues.length; i++) {
            const diff = validBatteryValues[i] - validBatteryValues[i - 1];
            if (diff > 0) {
              charged += diff;
            } else if (diff < 0) {
              drained += Math.abs(diff);
            }
          }
          if (charged > 0) {
            this.pushMetric(
              metrics,
              METRIC_TYPE.BODY_BATTERY_CHARGED,
              date,
              charged,
              0,
            );
          }
          if (drained > 0) {
            this.pushMetric(
              metrics,
              METRIC_TYPE.BODY_BATTERY_DRAINED,
              date,
              drained,
              0,
            );
          }
        }
      }
    }

    return metrics;
  }

  private pushMetric(
    target: MetricRecord[],
    type: METRIC_TYPE,
    date: Date | null,
    value?: number | null,
    precision?: number,
  ): void {
    if (!date) return;
    if (value === undefined || value === null) return;
    if (!Number.isFinite(value)) return;

    const normalized =
      precision === undefined ? value : this.round(value, precision);

    target.push({
      type,
      date,
      value: normalized,
    });
  }

  private parseCalendarDate(calendarDate?: string): Date | null {
    if (!calendarDate) {
      return null;
    }
    const date = new Date(`${calendarDate}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return this.startOfDay(date);
  }

  private dateFromTimestamp(
    timestampSeconds?: number,
    offsetSeconds?: number,
  ): Date | null {
    if (timestampSeconds === undefined) {
      return null;
    }
    const offset = offsetSeconds ?? 0;
    const date = new Date((timestampSeconds + offset) * 1000);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return this.startOfDay(date);
  }

  private startOfDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private secondsToHours(seconds?: number | null): number | undefined {
    if (seconds === undefined || seconds === null) {
      return undefined;
    }
    return this.round(seconds / 3600, 2);
  }

  private secondsToMinutes(seconds?: number | null): number | undefined {
    if (seconds === undefined || seconds === null) {
      return undefined;
    }
    return this.round(seconds / 60, 2);
  }

  private metersToKilometers(meters?: number | null): number | undefined {
    if (meters === undefined || meters === null) {
      return undefined;
    }
    return this.round(meters / 1000, 2);
  }

  private gramsToKilograms(grams?: number | null): number | undefined {
    if (grams === undefined || grams === null) {
      return undefined;
    }
    return this.round(grams / 1000, 2);
  }

  private extractNumericValues(data?: Record<string, number>): number[] {
    if (!data) {
      return [];
    }
    return Object.values(data).filter((value) => Number.isFinite(value));
  }

  private average(values: number[]): number | undefined {
    if (!values || values.length === 0) {
      return undefined;
    }
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
  }

  private round(value: number, precision = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  async handleActivityFilePingWebhook(
    payload: GarminActivityFilePingWebhook,
  ): Promise<void> {
    if (payload.fileType !== 'FIT' && payload.fileType !== 'GPX') {
      return;
    }

    const account = await this.prisma.provider_account.findFirst({
      where: {
        provider: connector_provider.GARMIN,
        external_user_id: payload.userId,
        status: 'active',
      },
      include: {
        athlete: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!account || !account.athlete || !account.athlete.user) {
      return;
    }

    if (!account.import_activities_enabled) {
      this.logger.debug(
        `Import disabled for Garmin account ${account.provider_account_id}, skipping activity file ping`,
      );
      return;
    }

    const activity = await this.prisma.event_activity.findFirst({
      where: {
        external_id: String(payload.activityId),
        provider: connector_provider.GARMIN,
      },
      include: {
        event: true,
      },
    });

    if (!activity) {
      await this.storePendingFile(String(payload.activityId), payload);
      return;
    }

    await this.processActivityFile(
      account,
      activity,
      payload.callbackURL,
      payload.fileType,
    );
  }

  private async processActivityFile(
    account: provider_account,
    activity: event_activity,
    callbackURL: string,
    fileType: 'FIT' | 'GPX',
  ): Promise<void> {
    try {
      const accessToken = await this.getValidAccessToken(account);

      const response = await axios.get(callbackURL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      const fitParseResult =
        fileType === 'FIT' ? await parseFitFile(response.data) : null;
      const activityStream =
        fileType === 'FIT'
          ? (fitParseResult?.stream ?? {})
          : await parseGpxFile(response.data);
      const compressedStream = compressActivityStream(activityStream);

      await this.prisma.event_activity.update({
        where: {
          event_activity_id: activity.event_activity_id,
        },
        data: {
          stream: compressedStream as object,
        },
      });

      if (
        fitParseResult?.segments?.length &&
        Object.keys(activityStream).length > 0
      ) {
        await this.syncSegmentsFromFit(
          activity.event_activity_id,
          fitParseResult.segments,
          activityStream,
        );
      }

      const activityWithEvent = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: activity.event_activity_id },
        select: {
          event: { select: { athlete_id: true } },
          stream: true,
          event_id: true,
        },
      });

      if (
        activityWithEvent?.stream &&
        activityWithEvent.event &&
        activityWithEvent.event_id
      ) {
        await this.queueService.addActivityProcessingJob(
          activity.event_activity_id,
          activityWithEvent.event_id,
          false,
        );
      }
    } catch {
      // Failed to download/parse file, activity remains without stream
    }
  }

  private async syncSegmentsFromFit(
    eventActivityId: number,
    segments: FitFileSegment[],
    stream: ActivityStream,
  ): Promise<void> {
    if (!segments.length || !stream?.time?.length) {
      return;
    }

    const segmentsData: Prisma.activity_segmentCreateManyInput[] = [];

    segments.forEach((segment, index) => {
      if (segment.endTimeSeconds <= segment.startTimeSeconds) {
        return;
      }

      const metrics = calculateSegmentMetrics(
        stream,
        segment.startTimeSeconds,
        segment.endTimeSeconds,
      );

      segmentsData.push({
        segment_type: activity_segment_type.LAP,
        name: segment.name ?? `Lap ${index + 1}`,
        order_index: index,
        start_time_seconds: Math.round(segment.startTimeSeconds),
        end_time_seconds: Math.round(segment.endTimeSeconds),
        ...metrics,
        event_activity_id: eventActivityId,
      });
    });

    if (!segmentsData.length) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.activity_segment.deleteMany({
        where: { event_activity_id: eventActivityId },
      });
      await tx.activity_segment.createMany({
        data: segmentsData,
      });
    });
  }

  async handleDeregistrationWebhook(
    payload: GarminDeregistrationWebhook,
  ): Promise<void> {
    const account = await this.prisma.provider_account.findFirst({
      where: {
        provider: connector_provider.GARMIN,
        external_user_id: payload.userId,
        status: 'active',
      },
    });

    if (!account) {
      return;
    }

    await this.prisma.provider_account.update({
      where: {
        provider_account_id: account.provider_account_id,
      },
      data: {
        status: 'revoked',
      },
    });
  }

  async handleUserPermissionsChangeWebhook(
    payload: GarminUserPermissionsChangeWebhook,
  ): Promise<void> {
    const account = await this.prisma.provider_account.findFirst({
      where: {
        provider: connector_provider.GARMIN,
        external_user_id: payload.userId,
        status: 'active',
      },
    });

    if (!account) {
      this.logger.debug(
        `User permissions change webhook received for unknown user: ${payload.userId}`,
      );
      return;
    }

    const hasWorkoutImport = payload.permissions.includes('WORKOUT_IMPORT');

    this.logger.log(
      `Garmin user permissions changed for account ${account.provider_account_id}. Permissions: ${payload.permissions.join(', ')}`,
    );

    if (!hasWorkoutImport) {
      this.logger.warn(
        `WORKOUT_IMPORT permission revoked for Garmin account ${account.provider_account_id}. Future workout syncs will fail.`,
      );
    }
  }
}
