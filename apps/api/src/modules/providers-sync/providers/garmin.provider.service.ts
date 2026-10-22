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
  ConnectorProvider,
  EventActivity,
  MetricType,
  Prisma,
  ProviderAccount,
} from '@openathlete/database';
import { ActivityStream, ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { ActivityRecording } from '../../core/helpers/activity-recording';
import { mapGarminActivityType } from '../../core/helpers/garmin';
import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundEnergy,
  roundHeartrate,
  roundMetricValue,
  roundSpeed,
} from '../../core/helpers/round-activity-values';
import { ActivityReconciliationService } from '../../core/services/activity-reconciliation.service';
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
} from '../base';
import {
  ImportOptions,
  ImportResult,
  ImportedActivity,
  ProviderImportCapability,
} from '../base';
import { providerRedirectUri } from '../base/provider-urls';

type MetricRecord = {
  type: MetricType;
  date: Date;
  value: number;
};

const GARMIN_CALLBACK_HOST = 'apis.garmin.com';

@Injectable()
export class GarminProviderService
  extends BaseProviderService
  implements ProviderImportCapability, OnModuleInit
{
  protected readonly provider = ConnectorProvider.GARMIN;
  private readonly importWindowMs = 30 * 24 * 60 * 60 * 1000;

  private getSafeGarminCallbackUrl(callbackURL: string): string {
    let url: URL;
    try {
      url = new URL(callbackURL);
    } catch {
      throw new BadRequestException('Invalid Garmin callbackURL');
    }

    if (url.protocol !== 'https:') {
      throw new BadRequestException('Invalid Garmin callbackURL');
    }

    // Disallow credentials in URL (userinfo).
    if (url.username || url.password) {
      throw new BadRequestException('Invalid Garmin callbackURL');
    }

    // Only allow default HTTPS port (or explicitly 443).
    if (url.port && url.port !== '443') {
      throw new BadRequestException('Invalid Garmin callbackURL');
    }

    // Callback URLs come from unauthenticated webhook payloads and are fetched
    // with the user's Garmin access token: only ever send it to Garmin.
    if (url.hostname !== GARMIN_CALLBACK_HOST) {
      throw new BadRequestException('Invalid Garmin callbackURL');
    }

    // Rebuild from a constant origin so the request host never comes from input.
    return `https://${GARMIN_CALLBACK_HOST}/${url.pathname.slice(1)}${url.search}`;
  }

  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: 'https://connect.garmin.com/oauth2Confirm',
      tokenUrl: 'https://diauth.garmin.com/di-oauth2-service/oauth/token',
      clientId: this.configService.get('GARMIN_CLIENT_ID') || '',
      clientSecret: this.configService.get('GARMIN_CLIENT_SECRET') || '',
      redirectUri: providerRedirectUri(
        this.configService.get('GARMIN_REDIRECT_URI'),
        this.configService.get('APP_URL'),
        'garmin',
      ),
      scopes: [],
    };
  }

  private redis: Redis | null = null;

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    private readonly activityFileParserService: ActivityFileParserService,
    private readonly reconciliation: ActivityReconciliationService,
  ) {
    super(prisma, configService);
  }

  async onModuleInit() {
    await this.initRedis();
  }

  private async initRedis() {
    try {
      const redisUrl = this.configService.get('REDIS_URL');
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
  }): Promise<ProviderAccount> {
    const adjustedExpiresIn = params.expiresIn
      ? Math.max(0, params.expiresIn - 600)
      : undefined;

    return super.saveProviderAccount({
      ...params,
      expiresIn: adjustedExpiresIn,
    });
  }

  /**
   * Safety buffer in ms applied on top of the stored `expiresAt` so we refresh
   * BEFORE Garmin actually rejects the token with 401. Combined with the 600s
   * subtracted in `saveProviderAccount`, this avoids the "401 -> retry" pattern
   * that Garmin counts as a duplicate (and "unprompted") pull.
   */
  private readonly tokenRefreshSafetyMs = 60_000;

  override async getValidAccessToken(
    account: ProviderAccount,
  ): Promise<string> {
    const refreshDeadline = account.expiresAt
      ? account.expiresAt.getTime() - this.tokenRefreshSafetyMs
      : 0;

    if (
      account.accessToken &&
      account.expiresAt &&
      Date.now() < refreshDeadline
    ) {
      return account.accessToken;
    }

    if (!account.refreshToken) {
      throw new Error(`No refresh token available for ${this.provider}`);
    }

    const tokenResponse = await this.refreshAccessToken(account.refreshToken);
    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + (tokenResponse.expires_in - 600) * 1000)
      : null;

    const updated = await this.prisma.providerAccount.update({
      where: {
        providerAccountId: account.providerAccountId,
      },
      data: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? account.refreshToken,
        expiresAt: expiresAt,
      },
    });

    // Keep the in-memory account object in sync so callers don't reuse stale
    // values for subsequent calls in the same logical operation.
    account.accessToken = updated.accessToken;
    account.refreshToken = updated.refreshToken;
    account.expiresAt = updated.expiresAt;

    return tokenResponse.access_token;
  }

  async connect(
    code: string,
    codeVerifier: string,
    athleteId: number,
  ): Promise<ProviderAccount> {
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
    account: ProviderAccount,
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
    account: ProviderAccount,
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

  /**
   * Maximum number of times we will re-trigger queueFullImport when the user
   * registration is not yet complete. Each attempt consumes API calls (one
   * backfill request + one chunked import scan). Without a bound, a permanently
   * incomplete registration would loop forever, multiplying "unprompted" pulls.
   */
  private static readonly MAX_FULL_IMPORT_REGISTRATION_RETRIES = 5;
  private static readonly FULL_IMPORT_REGISTRATION_RETRY_DELAY_MS = 5000;

  async queueFullImport(
    account: ProviderAccount,
    attempt = 0,
  ): Promise<FullImportResult> {
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
    } catch (error) {
      this.logger.warn(
        `Garmin backfill request failed for account ${account.providerAccountId} (attempt ${attempt + 1}): ${error instanceof Error ? error.message : String(error)}; falling back to chunked import`,
      );

      const activities = await this.importActivities(account, {
        startDate,
        endDate,
      });

      if (activities.length === 0) {
        const isComplete = await this.isUserRegistrationComplete(account);
        if (!isComplete) {
          if (
            attempt + 1 >=
            GarminProviderService.MAX_FULL_IMPORT_REGISTRATION_RETRIES
          ) {
            this.logger.warn(
              `Garmin user registration still incomplete after ${
                GarminProviderService.MAX_FULL_IMPORT_REGISTRATION_RETRIES
              } attempts for account ${account.providerAccountId}; giving up`,
            );
            return { queuedActivities: 0 };
          }

          setTimeout(() => {
            this.queueFullImport(account, attempt + 1).catch((err) => {
              this.logger.error(
                `Garmin queueFullImport retry failed for account ${account.providerAccountId}: ${err instanceof Error ? err.message : String(err)}`,
              );
            });
          }, GarminProviderService.FULL_IMPORT_REGISTRATION_RETRY_DELAY_MS);
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
    account: ProviderAccount,
    requestFn: (accessToken: string) => Promise<T>,
  ): Promise<T> {
    // Always go through getValidAccessToken which now refreshes proactively
    // using a 60s safety buffer. This makes the 401 path a true exception
    // rather than the common case.
    const accessToken = await this.getValidAccessToken(account);

    try {
      return await requestFn(accessToken);
    } catch (error) {
      if (
        !isAxiosError(error) ||
        error.response?.status !== 401 ||
        !account.refreshToken
      ) {
        throw error;
      }

      // 401 despite a fresh-looking token. Force a refresh and retry exactly
      // ONCE. Each retry is one extra GET against the Garmin endpoint, which
      // Garmin counts as an "unprompted pull" if the original ping has already
      // been associated with the first (failed) attempt. We log it so we can
      // see how often this happens in production.
      this.logger.warn(
        `Garmin 401 on authenticated request for account ${account.providerAccountId}; refreshing token and retrying once (this consumes an extra "pull" from Garmin's quota)`,
      );

      const tokenResponse = await this.refreshAccessToken(account.refreshToken);
      const expiresAt = tokenResponse.expires_in
        ? new Date(Date.now() + (tokenResponse.expires_in - 600) * 1000)
        : null;

      const updatedAccount = await this.prisma.providerAccount.update({
        where: {
          providerAccountId: account.providerAccountId,
        },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token ?? account.refreshToken,
          expiresAt: expiresAt,
        },
      });

      account.accessToken = updatedAccount.accessToken;
      account.refreshToken = updatedAccount.refreshToken;
      account.expiresAt = updatedAccount.expiresAt;

      return await requestFn(tokenResponse.access_token);
    }
  }

  async importActivities(
    account: ProviderAccount,
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

        const startDate = new Date(activity.startTimeInSeconds * 1000);
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
    account: ProviderAccount,
    activities: ImportedActivity[],
  ): Promise<number> {
    if (activities.length === 0) {
      return 0;
    }

    const existingExternalIds = await this.prisma.activitySource.findMany({
      where: {
        athleteId: account.athleteId,
        provider: this.provider,
        externalId: { in: activities.map((a) => a.externalId) },
      },
      select: { externalId: true },
    });
    const existingIdsSet = new Set(
      existingExternalIds.map((a) => a.externalId),
    );

    const newActivities = activities.filter(
      (a) => !existingIdsSet.has(a.externalId),
    );

    if (newActivities.length === 0) {
      this.logger.log(
        `No new Garmin activities to queue for account ${account.providerAccountId}`,
      );
      return 0;
    }

    await this.queueService.addActivityImportJobs(account, newActivities, true);
    return newActivities.length;
  }

  async importActivity(
    account: ProviderAccount,
    activity: ImportedActivity,
  ): Promise<ImportResult> {
    const source = await this.reconciliation.findSource(
      account.athleteId,
      this.provider,
      activity.externalId,
    );
    if (source)
      return {
        activity: source.eventActivity,
        created: false,
        receiptId: source.activitySourceId,
        revision: source.revision,
        processingPending: source.processingPending,
      };
    const recording = await this.fetchGarminActivityData(
      activity.raw as GarminActivitySummary,
    );
    const result = await this.reconciliation.reconcile(
      account.athleteId,
      this.provider,
      activity.externalId,
      {
        ...recording,
        name: activity.name,
        startDate: activity.startDate.toISOString(),
        endDate: activity.endDate.toISOString(),
        original: true,
        recordingKind: (activity.raw as GarminActivitySummary).isParent
          ? 'multisport_parent'
          : (activity.raw as GarminActivitySummary).parentSummaryId
            ? 'multisport_leg'
            : 'single',
        raw: activity.raw as object,
      },
    );
    const pendingFile = await this.getPendingFile(activity.externalId);
    if (pendingFile && result.activity) {
      await this.processActivityFile(
        account,
        result.activity,
        pendingFile.callbackURL,
        pendingFile.fileType as 'FIT' | 'GPX',
        activity.externalId,
        false,
      );
      const updated = await this.reconciliation.findSource(
        account.athleteId,
        this.provider,
        activity.externalId,
      );
      if (updated)
        return {
          ...result,
          activity: updated.eventActivity,
          revision: updated.revision,
          processingPending: updated.processingPending,
        };
    }
    return result;
  }

  private async fetchGarminActivityData(
    activity: GarminActivitySummary,
  ): Promise<Pick<ActivityRecording, 'values' | 'stream'>> {
    const activityStream: ActivityStream = {};

    const summary = activity;
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

    return {
      values: {
        distance: roundDistance(summary.distanceInMeters || 0),
        elevationGain: roundElevation(summary.totalElevationGainInMeters || 0),
        movingTime: movingTime,
        averageSpeed:
          roundSpeed(summary.averageSpeedInMetersPerSecond || 0) ?? 0,
        maxSpeed: roundSpeed(summary.maxSpeedInMetersPerSecond || 0) ?? 0,
        averageCadence: averageCadence,
        averageHeartrate: roundHeartrate(
          summary.averageHeartRateInBeatsPerMinute,
        ),
        maxHeartrate: roundHeartrate(summary.maxHeartRateInBeatsPerMinute),
        kilojoules: summary.activeKilocalories
          ? roundEnergy(summary.activeKilocalories * 4.184)
          : undefined,
        sport,
      },
      stream: activityStream,
    };
  }

  async handleActivityPingWebhook(
    payload: GarminActivityPingWebhook,
  ): Promise<void> {
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        provider: ConnectorProvider.GARMIN,
        externalUserId: payload.userId,
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
      this.logger.warn(
        `Garmin activity ping for unknown/inactive user ${payload.userId}; no callback fetched`,
      );
      return;
    }

    // Always fetch the callback URL to "answer" the ping (Garmin requirement),
    // even if import is disabled. Persistence/queueing is skipped in that case.
    let activities: GarminActivitySummary[] = [];
    try {
      activities = await this.fetchActivitySummaries(
        account,
        payload.callbackURL,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch Garmin activity callback for account ${account.providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    if (!account.importActivitiesEnabled) {
      this.logger.debug(
        `Activity import disabled for Garmin account ${account.providerAccountId}; fetched ${activities.length} activities but skipping queue`,
      );
      return;
    }

    if (activities.length === 0) {
      return;
    }

    const activityIds = activities.map((a) => String(a.activityId));
    const existingExternalIds = await this.prisma.eventActivity.findMany({
      where: {
        provider: this.provider,
        event: { athleteId: account.athleteId },
        externalId: {
          in: activityIds,
        },
      },
      select: {
        externalId: true,
      },
    });

    const existingIdsSet = new Set(
      existingExternalIds.map((a) => a.externalId),
    );

    const newActivities: ImportedActivity[] = activities
      .filter((a) => !existingIdsSet.has(String(a.activityId)))
      .map((activity) => {
        const startDate = new Date(activity.startTimeInSeconds * 1000);
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

    try {
      await this.queueService.addActivityImportJobs(
        account,
        newActivities,
        false,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue Garmin activities for account ${account.providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async fetchActivitySummaries(
    account: ProviderAccount,
    callbackURL: string,
  ): Promise<GarminActivitySummary[]> {
    const safeCallbackUrl = this.getSafeGarminCallbackUrl(callbackURL);
    return this.makeAuthenticatedRequest<GarminActivitySummary[]>(
      account,
      async (accessToken) => {
        const response = await axios.get<GarminActivitySummary[]>(
          safeCallbackUrl,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            timeout: 30000,
          },
        );
        return Array.isArray(response.data) ? response.data : [];
      },
    );
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
          this.logger.warn(
            `Garmin ${summaryType} ping missing userId or callbackURL; skipping`,
          );
          continue;
        }

        const account = await this.prisma.providerAccount.findFirst({
          where: {
            provider: ConnectorProvider.GARMIN,
            externalUserId: notification.userId,
            status: 'active',
          },
        });

        if (!account) {
          this.logger.warn(
            `Garmin ${summaryType} ping for unknown/inactive user ${notification.userId}; no callback fetched`,
          );
          continue;
        }

        try {
          await this.processHealthSummary(
            account,
            summaryType,
            notification.callbackURL,
            account.importMetricsEnabled,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process Garmin ${summaryType} summary for account ${account.providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  private async processHealthSummary(
    account: ProviderAccount,
    summaryType: GarminHealthSummaryType,
    callbackURL: string,
    shouldPersist: boolean,
  ): Promise<void> {
    // Epochs are 15-minute wellness slices already aggregated in dailies.
    // We still need to answer the ping (fetch the callback) to keep Garmin happy.
    if (summaryType === 'epochs') {
      await this.fetchHealthSummaries(account, callbackURL);
      if (shouldPersist) {
        this.logger.debug(
          `Garmin epochs ping fetched for account ${account.providerAccountId}; data already aggregated in dailies`,
        );
      }
      return;
    }

    const persistIfEnabled = async <U>(
      data: U[],
      mapper: (data: U[]) => MetricRecord[],
    ): Promise<void> => {
      if (!shouldPersist) {
        this.logger.debug(
          `Garmin ${summaryType} ping answered for account ${account.providerAccountId} (import disabled, ${data.length} item(s) discarded)`,
        );
        return;
      }
      const metrics = mapper(data);
      await this.saveMetrics(account.athleteId, metrics);
    };

    switch (summaryType) {
      case 'dailies': {
        const data = await this.fetchHealthSummaries<GarminDailySummary>(
          account,
          callbackURL,
        );
        await persistIfEnabled(data, (d) => this.mapDailySummariesToMetrics(d));
        break;
      }
      case 'sleeps': {
        const data = await this.fetchHealthSummaries<GarminSleepSummary>(
          account,
          callbackURL,
        );
        await persistIfEnabled(data, (d) => this.mapSleepSummariesToMetrics(d));
        break;
      }
      case 'bodyComps': {
        const data =
          await this.fetchHealthSummaries<GarminBodyCompositionSummary>(
            account,
            callbackURL,
          );
        await persistIfEnabled(data, (d) =>
          this.mapBodyCompSummariesToMetrics(d),
        );
        break;
      }
      case 'userMetrics': {
        const data = await this.fetchHealthSummaries<GarminUserMetricsSummary>(
          account,
          callbackURL,
        );
        await persistIfEnabled(data, (d) =>
          this.mapUserMetricsSummariesToMetrics(d),
        );
        break;
      }
      case 'pulseox': {
        const data = await this.fetchHealthSummaries<GarminPulseOxSummary>(
          account,
          callbackURL,
        );
        await persistIfEnabled(data, (d) =>
          this.mapPulseOxSummariesToMetrics(d),
        );
        break;
      }
      case 'allDayRespiration': {
        const data = await this.fetchHealthSummaries<GarminRespirationSummary>(
          account,
          callbackURL,
        );
        await persistIfEnabled(data, (d) =>
          this.mapRespirationSummariesToMetrics(d),
        );
        break;
      }
      case 'healthSnapshot': {
        const data =
          await this.fetchHealthSummaries<GarminHealthSnapshotSummary>(
            account,
            callbackURL,
          );
        await persistIfEnabled(data, (d) =>
          this.mapHealthSnapshotSummariesToMetrics(d),
        );
        break;
      }
      case 'hrv': {
        const data = await this.fetchHealthSummaries<GarminHrvSummary>(
          account,
          callbackURL,
        );
        await persistIfEnabled(data, (d) => this.mapHrvSummariesToMetrics(d));
        break;
      }
      case 'bloodPressures': {
        const data =
          await this.fetchHealthSummaries<GarminBloodPressureSummary>(
            account,
            callbackURL,
          );
        await persistIfEnabled(data, (d) =>
          this.mapBloodPressureSummariesToMetrics(d),
        );
        break;
      }
      case 'skinTemp': {
        const data = await this.fetchHealthSummaries<GarminSkinTempSummary>(
          account,
          callbackURL,
        );
        await persistIfEnabled(data, (d) =>
          this.mapSkinTempSummariesToMetrics(d),
        );
        break;
      }
      case 'stressDetails': {
        const data =
          await this.fetchHealthSummaries<GarminStressDetailsSummary>(
            account,
            callbackURL,
          );
        await persistIfEnabled(data, (d) =>
          this.mapStressDetailsSummariesToMetrics(d),
        );
        break;
      }
      default: {
        this.logger.warn(
          `Unhandled Garmin health summary type: ${summaryType as string}; still fetching callback to answer ping`,
        );
        await this.fetchHealthSummaries(account, callbackURL);
        break;
      }
    }
  }

  private async fetchHealthSummaries<T>(
    account: ProviderAccount,
    callbackURL: string,
  ): Promise<T[]> {
    const safeCallbackUrl = this.getSafeGarminCallbackUrl(callbackURL);
    return this.makeAuthenticatedRequest<T[]>(account, async (accessToken) => {
      try {
        const response = await axios.get<T[] | T>(safeCallbackUrl, {
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
      } catch (error) {
        // Let 401 propagate so makeAuthenticatedRequest can refresh the token
        // and retry. Other 4xx are treated as "answered with empty payload".
        if (isAxiosError(error) && error.response?.status === 401) {
          throw error;
        }
        if (
          isAxiosError(error) &&
          error.response?.status &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          this.logger.warn(
            `Garmin health callback returned ${error.response.status} for account ${account.providerAccountId}: ${error.message}`,
          );
          return [];
        }
        this.logger.error(
          `Garmin health callback fetch failed for account ${account.providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
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
        this.prisma.athleteMetric.upsert({
          where: {
            athleteId_type_date: {
              athleteId: athleteId,
              type: metric.type as unknown as MetricType,
              date: metric.date,
            },
          },
          create: {
            athleteId: athleteId,
            type: metric.type as unknown as MetricType,
            date: metric.date,
            value: roundMetricValue(metric.value),
            source: 'GARMIN',
          },
          update: {
            value: roundMetricValue(metric.value),
            source: 'GARMIN',
            sourceMetadata: Prisma.DbNull,
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
        MetricType.DAILY_CALORIES,
        date,
        totalCalories,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.DAILY_ACTIVE_CALORIES,
        date,
        summary.activeKilocalories,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.DAILY_BMR_CALORIES,
        date,
        summary.bmrKilocalories,
        0,
      );
      this.pushMetric(metrics, MetricType.DAILY_STEPS, date, summary.steps, 0);
      this.pushMetric(
        metrics,
        MetricType.DAILY_DISTANCE,
        date,
        this.metersToKilometers(summary.distanceInMeters),
      );
      this.pushMetric(
        metrics,
        MetricType.DAILY_ACTIVE_MINUTES,
        date,
        this.secondsToMinutes(summary.activeTimeInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.DAILY_MODERATE_MINUTES,
        date,
        this.secondsToMinutes(summary.moderateIntensityDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.DAILY_VIGOROUS_MINUTES,
        date,
        this.secondsToMinutes(summary.vigorousIntensityDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.DAILY_FLOORS,
        date,
        summary.floorsClimbed,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.HR_MIN_DAILY,
        date,
        summary.minHeartRateInBeatsPerMinute,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.HR_AVG_DAILY,
        date,
        summary.averageHeartRateInBeatsPerMinute,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.HR_MAX_DAILY,
        date,
        summary.maxHeartRateInBeatsPerMinute,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.HR_REST,
        date,
        summary.restingHeartRateInBeatsPerMinute,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.STRESS_AVERAGE,
        date,
        summary.averageStressLevel,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.STRESS_MAX,
        date,
        summary.maxStressLevel,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.STRESS_DURATION,
        date,
        this.secondsToMinutes(summary.stressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.STRESS_REST_DURATION,
        date,
        this.secondsToMinutes(summary.restStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.STRESS_ACTIVITY_DURATION,
        date,
        this.secondsToMinutes(summary.activityStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.STRESS_LOW_DURATION,
        date,
        this.secondsToMinutes(summary.lowStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.STRESS_MEDIUM_DURATION,
        date,
        this.secondsToMinutes(summary.mediumStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.STRESS_HIGH_DURATION,
        date,
        this.secondsToMinutes(summary.highStressDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.BODY_BATTERY_CHARGED,
        date,
        summary.bodyBatteryChargedValue,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.BODY_BATTERY_DRAINED,
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
        MetricType.SLEEP_DURATION,
        date,
        this.secondsToHours(summary.durationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.SLEEP_REM_DURATION,
        date,
        this.secondsToHours(summary.remSleepInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.SLEEP_DEEP_DURATION,
        date,
        this.secondsToHours(summary.deepSleepDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.SLEEP_LIGHT_DURATION,
        date,
        this.secondsToHours(summary.lightSleepDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.SLEEP_AWAKE_DURATION,
        date,
        this.secondsToHours(summary.awakeDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.NAP_DURATION,
        date,
        this.secondsToHours(summary.totalNapDurationInSeconds),
      );
      this.pushMetric(
        metrics,
        MetricType.SLEEP_SCORE,
        date,
        summary.overallSleepScore?.value,
        0,
      );

      const respirationAvg = this.average(
        this.extractNumericValues(summary.timeOffsetSleepRespiration),
      );
      this.pushMetric(
        metrics,
        MetricType.SLEEP_RESPIRATION_AVG,
        date,
        respirationAvg,
      );

      const spo2Avg = this.average(
        this.extractNumericValues(summary.timeOffsetSleepSpo2),
      );
      this.pushMetric(metrics, MetricType.SLEEP_SPO2_AVG, date, spo2Avg);
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
        MetricType.WEIGHT,
        date,
        this.gramsToKilograms(summary.weightInGrams),
      );
      this.pushMetric(metrics, MetricType.BMI, date, summary.bodyMassIndex);
      this.pushMetric(
        metrics,
        MetricType.BODY_FAT,
        date,
        summary.bodyFatInPercent,
      );
      this.pushMetric(
        metrics,
        MetricType.BODY_WATER,
        date,
        summary.bodyWaterInPercent,
      );
      this.pushMetric(
        metrics,
        MetricType.MUSCLE_MASS,
        date,
        this.gramsToKilograms(summary.muscleMassInGrams),
      );
      this.pushMetric(
        metrics,
        MetricType.BONE_MASS,
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

      this.pushMetric(metrics, MetricType.VO2MAX, date, summary.vo2Max);
      this.pushMetric(
        metrics,
        MetricType.VO2MAX_CYCLING,
        date,
        summary.vo2MaxCycling,
      );
      this.pushMetric(
        metrics,
        MetricType.FITNESS_AGE,
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
        MetricType.PULSE_OX_AVG,
        date,
        value.sum / value.count,
      );

      if (Number.isFinite(value.min)) {
        this.pushMetric(metrics, MetricType.PULSE_OX_MIN, date, value.min);
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
        MetricType.RESPIRATION_RATE_AVG,
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
              MetricType.SNAPSHOT_HEART_RATE_AVG,
              date,
              item.avgValue,
            );
            break;
          case 'stress':
            this.pushMetric(
              metrics,
              MetricType.SNAPSHOT_STRESS_AVG,
              date,
              item.avgValue,
            );
            break;
          case 'respiration':
            this.pushMetric(
              metrics,
              MetricType.SNAPSHOT_RESPIRATION_AVG,
              date,
              item.avgValue,
            );
            break;
          case 'spo2':
            this.pushMetric(
              metrics,
              MetricType.SNAPSHOT_SPO2_AVG,
              date,
              item.avgValue,
            );
            break;
          case 'rmssd_hrv':
            this.pushMetric(
              metrics,
              MetricType.SNAPSHOT_RMSSD,
              date,
              item.avgValue,
            );
            break;
          case 'sdrr_hrv':
            this.pushMetric(
              metrics,
              MetricType.SNAPSHOT_SDNN,
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
        MetricType.HRV_LAST_NIGHT_AVG,
        date,
        summary.lastNightAvg,
      );
      this.pushMetric(
        metrics,
        MetricType.HRV_LAST_NIGHT_5MIN_HIGH,
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
        MetricType.BLOOD_PRESSURE_SYSTOLIC,
        date,
        summary.systolic,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.BLOOD_PRESSURE_DIASTOLIC,
        date,
        summary.diastolic,
        0,
      );
      this.pushMetric(
        metrics,
        MetricType.BLOOD_PRESSURE_PULSE,
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
        MetricType.SKIN_TEMP_DEVIATION,
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
            this.pushMetric(metrics, MetricType.STRESS_AVERAGE, date, avg, 0);
          }
          if (Number.isFinite(max)) {
            this.pushMetric(metrics, MetricType.STRESS_MAX, date, max, 0);
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
              MetricType.BODY_BATTERY_CHARGED,
              date,
              charged,
              0,
            );
          }
          if (drained > 0) {
            this.pushMetric(
              metrics,
              MetricType.BODY_BATTERY_DRAINED,
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
    type: MetricType,
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
      this.logger.debug(
        `Garmin activity file ping skipped: unsupported fileType ${payload.fileType}`,
      );
      return;
    }

    const account = await this.prisma.providerAccount.findFirst({
      where: {
        provider: ConnectorProvider.GARMIN,
        externalUserId: payload.userId,
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
      this.logger.warn(
        `Garmin activity file ping for unknown/inactive user ${payload.userId}; no callback fetched`,
      );
      return;
    }

    if (!account.importActivitiesEnabled) {
      this.logger.debug(
        `Activity import disabled for Garmin account ${account.providerAccountId}; activity file ping not answered`,
      );
      return;
    }

    const source = await this.reconciliation.findSource(
      account.athleteId,
      this.provider,
      String(payload.activityId),
    );
    const activity = source?.eventActivity;

    if (!activity) {
      // Activity ping hasn't been processed yet. Cache the callback URL so we
      // can fetch the file once the activity is created in our DB.
      this.logger.debug(
        `Caching Garmin activity file callback for activity ${payload.activityId} (not in DB yet)`,
      );
      await this.storePendingFile(String(payload.activityId), payload);
      return;
    }

    await this.processActivityFile(
      account,
      activity,
      payload.callbackURL,
      payload.fileType,
      String(payload.activityId),
    );
  }

  private async processActivityFile(
    account: ProviderAccount,
    activity: EventActivity,
    callbackURL: string,
    fileType: 'FIT' | 'GPX',
    externalId: string,
    dispatch = true,
  ): Promise<void> {
    try {
      const accessToken = await this.getValidAccessToken(account);

      const safeCallbackUrl = this.getSafeGarminCallbackUrl(callbackURL);
      const response = await axios.get(safeCallbackUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      const parseResult = await this.activityFileParserService.parseByFileType(
        response.data,
        fileType,
      );
      const activityStream = parseResult.stream;
      const source = await this.reconciliation.findSource(
        account.athleteId,
        this.provider,
        externalId,
      );
      const canonical = await this.prisma.eventActivity.findUniqueOrThrow({
        where: { eventActivityId: activity.eventActivityId },
        include: { event: true },
      });
      const stored = source?.payload as unknown as
        ActivityRecording | undefined;
      const recording = stored?.values
        ? stored
        : this.reconciliation.fromActivity(canonical);
      const result = await this.reconciliation.reconcile(
        account.athleteId,
        this.provider,
        externalId,
        {
          ...recording,
          stream: activityStream,
          laps: (parseResult.segments ?? [])
            .filter((lap) => lap.endTimeSeconds > lap.startTimeSeconds)
            .map((lap) => ({
              startDate: new Date(
                Date.parse(recording.startDate) + lap.startTimeSeconds * 1000,
              ).toISOString(),
              endDate: new Date(
                Date.parse(recording.startDate) + lap.endTimeSeconds * 1000,
              ).toISOString(),
              name: lap.name,
            })),
          raw: { ...recording.raw, fileSegments: parseResult.segments ?? [] },
        },
      );
      if (dispatch && result.activity && result.processingPending) {
        await this.queueService.addActivityProcessingJob(
          result.activity.eventActivityId,
          result.activity.eventId,
          true,
          `source-${result.receiptId}-${result.revision}`,
        );
        await this.reconciliation.markDispatched(
          result.receiptId,
          result.revision,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to download/parse Garmin activity file for activity ${activity.eventActivityId} (account ${account.providerAccountId}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async handleDeregistrationWebhook(
    payload: GarminDeregistrationWebhook,
  ): Promise<void> {
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        provider: ConnectorProvider.GARMIN,
        externalUserId: payload.userId,
        status: 'active',
      },
    });

    if (!account) {
      return;
    }

    await this.prisma.providerAccount.update({
      where: {
        providerAccountId: account.providerAccountId,
      },
      data: {
        status: 'revoked',
      },
    });
  }

  async handleUserPermissionsChangeWebhook(
    payload: GarminUserPermissionsChangeWebhook,
  ): Promise<void> {
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        provider: ConnectorProvider.GARMIN,
        externalUserId: payload.userId,
        status: 'active',
      },
    });

    if (!account) {
      this.logger.debug(
        `User permissions change webhook received for unknown user: ${payload.userId}`,
      );
      return;
    }

    if (!payload.permissions) {
      this.logger.debug(
        `User permissions change webhook received for user ${payload.userId} with no permissions`,
      );
      return;
    }

    const hasWorkoutImport = payload.permissions.includes('WORKOUT_IMPORT');

    this.logger.log(
      `Garmin user permissions changed for account ${account.providerAccountId}. Permissions: ${payload.permissions.join(', ')}`,
    );

    if (!hasWorkoutImport) {
      this.logger.warn(
        `WORKOUT_IMPORT permission revoked for Garmin account ${account.providerAccountId}. Future workout syncs will fail.`,
      );
    }
  }
}
