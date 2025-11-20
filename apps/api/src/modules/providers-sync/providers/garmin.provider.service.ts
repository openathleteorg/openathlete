import axios, { isAxiosError } from 'axios';
import Redis from 'ioredis';
import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  Prisma,
  activity_segment_type,
  connector_provider,
  event_activity,
  event_type,
  provider_account,
} from '@openathlete/database';
import { ActivityStream, ApiEnvSchemaType } from '@openathlete/shared';

import { calculateSegmentMetrics } from '../../core/helpers/activity-segment';
import {
  compressActivityStream,
  uncompressActivityStream,
} from '../../core/helpers/activity-stream';
import { mapGarminActivityType } from '../../core/helpers/garmin';
import {
  parseFitFile,
  parseGpxFile,
} from '../../core/helpers/garmin-file-parser';
import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundEnergy,
  roundHeartrate,
  roundSpeed,
} from '../../core/helpers/round-activity-values';
import {
  GarminActivityDetail,
  GarminActivityFilePingWebhook,
  GarminActivityPingWebhook,
  GarminActivitySummary,
  GarminDeregistrationWebhook,
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

@Injectable()
export class GarminProviderService
  extends BaseProviderService
  implements ProviderImportCapability
{
  protected readonly provider = connector_provider.GARMIN;
  private readonly backfillWindowSeconds = 30 * 24 * 60 * 60;
  private readonly fullImportMonths: number;
  private readonly backfillDelayMs: number;
  private readonly maxBackfillDaysPerMinute: number;
  private readonly effectiveBackfillDelayMs: number;

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
    const monthsConfig =
      this.configService.get('GARMIN_FULL_IMPORT_MONTHS') ?? '24';
    const delayConfig =
      this.configService.get('GARMIN_BACKFILL_DELAY_MS') ?? '750';
    const maxDaysConfig =
      this.configService.get('GARMIN_BACKFILL_MAX_DAYS_PER_MINUTE') ?? '100';

    const parsedMonths = Number(monthsConfig);
    this.fullImportMonths = Number.isFinite(parsedMonths)
      ? Math.max(1, parsedMonths)
      : 120;

    const parsedDelay = Number(delayConfig);
    this.backfillDelayMs = Number.isFinite(parsedDelay)
      ? Math.max(100, parsedDelay)
      : 750;

    const parsedMaxDays = Number(maxDaysConfig);
    this.maxBackfillDaysPerMinute = Number.isFinite(parsedMaxDays)
      ? Math.max(1, parsedMaxDays)
      : 100;

    const windowDays = this.backfillWindowSeconds / (24 * 60 * 60);
    const maxWindowsPerMinute = Math.max(
      1,
      Math.floor(this.maxBackfillDaysPerMinute / windowDays),
    );
    const computedDelay = Math.ceil(60000 / maxWindowsPerMinute);
    this.effectiveBackfillDelayMs = Math.max(
      this.backfillDelayMs,
      computedDelay,
    );

    this.initRedis();
  }

  private async initRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        this.redis = new Redis({
          host: 'localhost',
          port: 6379,
        });
      } else {
        this.redis = new Redis(redisUrl);
      }
    } catch {
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

  async requestActivityBackfillWindow(
    account: provider_account,
    summaryStartTimeInSeconds: number,
    summaryEndTimeInSeconds: number,
  ): Promise<void> {
    const accessToken = await this.getValidAccessToken(account);

    try {
      await axios.get(
        'https://apis.garmin.com/wellness-api/rest/backfill/activities',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            summaryStartTimeInSeconds,
            summaryEndTimeInSeconds,
          },
          timeout: 10000,
        },
      );
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 429) {
          this.logger.warn(
            `Garmin backfill throttled for account ${account.provider_account_id} window ${summaryStartTimeInSeconds}-${summaryEndTimeInSeconds}: ${error.message}`,
          );
          throw error;
        }
        if (status === 400) {
          this.logger.warn(
            `Garmin backfill rejected (400) for account ${account.provider_account_id} window ${summaryStartTimeInSeconds}-${summaryEndTimeInSeconds}: ${error.message}`,
          );
          return;
        }
      }
      throw error;
    }
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

    const activities = await this.importActivities(account);

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
    const backfillJobs = await this.scheduleBackfillWindows(account);

    return {
      queuedActivities: queued,
      backfillRequested: backfillJobs > 0,
    };
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

  private buildBackfillWindows(
    account: provider_account,
    nowSeconds: number,
  ): Array<{
    start: number;
    end: number;
  }> {
    const totalRangeSeconds =
      this.fullImportMonths * this.backfillWindowSeconds;
    const earliestByConfig = Math.max(0, nowSeconds - totalRangeSeconds);
    const earliest = Math.max(0, earliestByConfig);

    // Skip the most recent window (already covered by importActivities)
    let cursorEnd = nowSeconds - this.backfillWindowSeconds;
    const windows: Array<{ start: number; end: number }> = [];

    while (cursorEnd > earliest) {
      const start = Math.max(earliest, cursorEnd - this.backfillWindowSeconds);
      const end = cursorEnd;

      if (end <= start) {
        break;
      }

      windows.push({ start, end });
      cursorEnd -= this.backfillWindowSeconds;
    }

    return windows.reverse();
  }

  private async scheduleBackfillWindows(
    account: provider_account,
  ): Promise<number> {
    const windows = this.buildBackfillWindows(
      account,
      Math.floor(Date.now() / 1000),
    );
    if (windows.length === 0) {
      return 0;
    }

    return this.queueService.addGarminBackfillJobs(
      account,
      windows,
      this.effectiveBackfillDelayMs,
    );
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
      account,
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
    account: provider_account,
    event: { event_id: number },
    activity: GarminActivitySummary,
  ): Promise<event_activity> {
    const activityStream: ActivityStream = {};
    let activityDetail: GarminActivityDetail | null = null;

    if (!activity.manual) {
      const uploadStartTime = activity.startTimeInSeconds - 12 * 60 * 60;
      const uploadEndTime = activity.startTimeInSeconds + 12 * 60 * 60;

      try {
        const activityDetails = await this.makeAuthenticatedRequest<
          GarminActivityDetail[]
        >(account, async (accessToken) => {
          const response = await axios.get<GarminActivityDetail[]>(
            'https://apis.garmin.com/wellness-api/rest/activityDetails',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              params: {
                uploadStartTimeInSeconds: uploadStartTime,
                uploadEndTimeInSeconds: uploadEndTime,
              },
              timeout: 45000,
            },
          );
          return response.data;
        });

        activityDetail =
          activityDetails.find(
            (detail) =>
              String(detail.activityId) === String(activity.activityId),
          ) || null;
      } catch {
        // Activity will be saved without stream data
      }

      if (activityDetail?.samples && activityDetail.samples.length > 0) {
        const samples = activityDetail.samples;
        const activityStartTime = activity.startTimeInSeconds;

        const time: number[] = [];
        const latlng: number[][] = [];
        const altitude: number[] = [];
        const heartrate: number[] = [];
        const cadence: number[] = [];
        const power: number[] = [];
        const distance: number[] = [];

        for (const sample of samples) {
          const sampleTime = sample.startTimeInSeconds - activityStartTime;
          time.push(sampleTime);

          if (
            sample.latitudeInDegree !== undefined &&
            sample.longitudeInDegree !== undefined
          ) {
            latlng.push([sample.latitudeInDegree, sample.longitudeInDegree]);
          }

          if (sample.elevationInMeters !== undefined) {
            altitude.push(sample.elevationInMeters);
          }

          if (sample.heartRate !== undefined) {
            heartrate.push(sample.heartRate);
          }

          if (sample.bikeCadenceInRPM !== undefined) {
            cadence.push(sample.bikeCadenceInRPM);
          } else if (sample.stepsPerMinute !== undefined) {
            cadence.push(sample.stepsPerMinute);
          } else if (sample.swimCadenceInStrokesPerMinute !== undefined) {
            cadence.push(sample.swimCadenceInStrokesPerMinute);
          }

          if (sample.powerInWatts !== undefined) {
            power.push(sample.powerInWatts);
          }

          if (sample.totalDistanceInMeters !== undefined) {
            distance.push(sample.totalDistanceInMeters);
          }
        }

        if (time.length > 0) {
          activityStream.time = time;
        }
        if (latlng.length > 0) {
          activityStream.latlng = latlng;
        }
        if (altitude.length > 0) {
          activityStream.altitude = altitude;
        }
        if (heartrate.length > 0) {
          activityStream.heartrate = heartrate;
        }
        if (cadence.length > 0) {
          activityStream.cadence = cadence;
        }
        if (power.length > 0) {
          activityStream.watts = power;
        }
        if (distance.length > 0) {
          activityStream.distance = distance;
        }
      }
    }

    const summary = activityDetail?.summary || activity;
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

    const movingTime =
      activityDetail?.samples?.[activityDetail.samples.length - 1]
        ?.movingDurationInSeconds || summary.durationInSeconds;

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

    // Extract and store laps/segments if available
    if (
      activityDetail?.laps &&
      activityDetail.laps.length > 0 &&
      activityStream.time &&
      activityStream.time.length > 0
    ) {
      const laps = activityDetail.laps;
      const activityStartTime = activity.startTimeInSeconds;
      const totalDuration = summary.durationInSeconds;

      // Uncompress stream to calculate segment metrics
      const uncompressedStream = uncompressActivityStream(
        compressedActivityStream,
      );

      const segmentsData: Prisma.activity_segmentCreateManyInput[] = [];
      for (let i = 0; i < laps.length; i++) {
        const lap = laps[i];
        const lapStartTimeSeconds = lap.startTimeInSeconds - activityStartTime;
        const lapEndTimeSeconds =
          i < laps.length - 1
            ? laps[i + 1].startTimeInSeconds - activityStartTime
            : totalDuration;

        // Only create segment if it has valid time range
        if (
          lapStartTimeSeconds >= 0 &&
          lapEndTimeSeconds > lapStartTimeSeconds
        ) {
          const metrics = calculateSegmentMetrics(
            uncompressedStream,
            lapStartTimeSeconds,
            lapEndTimeSeconds,
          );

          segmentsData.push({
            segment_type: activity_segment_type.LAP,
            name: `Lap ${i + 1}`,
            order_index: i,
            start_time_seconds: Math.round(lapStartTimeSeconds),
            end_time_seconds: Math.round(lapEndTimeSeconds),
            ...metrics,
            event_activity_id: savedActivity.event_activity_id,
          });
        }
      }

      // Create segments in batch
      if (segmentsData.length > 0) {
        await this.prisma.activity_segment.createMany({
          data: segmentsData,
        });
      }
    }

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

      const activityStream =
        fileType === 'FIT'
          ? await parseFitFile(response.data)
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
}
