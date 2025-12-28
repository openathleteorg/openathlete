import axios, { isAxiosError } from 'axios';

import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ConnectorProvider,
  EventActivity,
  EventType,
  ProviderAccount,
} from '@openathlete/database';
import { ActivityStream, ApiEnvSchemaType } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { compressActivityStream } from '../../core/helpers/activity-stream';
import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundEnergy,
  roundHeartrate,
  roundPower,
  roundSpeed,
} from '../../core/helpers/round-activity-values';
import { mapStravaSportType } from '../../core/helpers/strava';
import { StravaSteam, StravaSummaryActivity } from '../../core/types/connector';
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
  ImportedActivity,
  ProviderImportCapability,
} from '../base/provider-import.interface';

@Injectable()
export class StravaProviderService
  extends BaseProviderService
  implements ProviderImportCapability
{
  protected readonly provider = ConnectorProvider.STRAVA;

  protected get oauthConfig(): OAuthConfig {
    return {
      authorizationUrl: 'https://www.strava.com/oauth/authorize',
      tokenUrl: 'https://www.strava.com/api/v3/oauth/token',
      clientId: this.configService.get('STRAVA_CLIENT_ID'),
      clientSecret: this.configService.get('STRAVA_CLIENT_SECRET'),
      redirectUri: this.configService.get('STRAVA_REDIRECT_URI'),
      scopes: ['read', 'activity:read_all'],
    };
  }

  constructor(
    prisma: PrismaService,
    configService: ConfigService<ApiEnvSchemaType, true>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
  ) {
    super(prisma, configService);
  }

  /**
   * Strava-specific: Override refresh to use different endpoint
   */
  override async refreshAccessToken(
    refreshToken: string,
  ): Promise<OAuthTokenResponse> {
    try {
      const { data } = await axios.post<OAuthTokenResponse>(
        'https://www.strava.com/api/v3/oauth/token',
        {
          client_id: this.oauthConfig.clientId,
          client_secret: this.oauthConfig.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error(
          `Strava token refresh failed: ${JSON.stringify(error.response?.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Strava-specific: Override getValidAccessToken (Strava doesn't provide expires_in)
   */
  override async getValidAccessToken(
    account: ProviderAccount,
  ): Promise<string> {
    // Strava access tokens don't expire (or expire very rarely)
    // So we can use stored token if it exists
    if (account.accessToken) {
      return account.accessToken;
    }

    // Otherwise refresh (will generate new access token)
    if (!account.refreshToken) {
      throw new Error('No refresh token available for Strava');
    }

    this.logger.debug(
      `Refreshing Strava access token for athlete ${account.athleteId}`,
    );

    const tokenResponse = await this.refreshAccessToken(account.refreshToken);

    // Strava doesn't provide expires_in, so we set expires_at to null
    await this.prisma.providerAccount.update({
      where: {
        providerAccountId: account.providerAccountId,
      },
      data: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? account.refreshToken,
        expiresAt: null, // Strava tokens don't expire
      },
    });

    return tokenResponse.access_token;
  }

  /**
   * Make an authenticated request to Strava API with automatic token refresh on 401
   * @param account Provider account
   * @param requestFn Function that makes the API request with the access token
   * @returns The response data
   */
  private async makeAuthenticatedRequest<T>(
    account: ProviderAccount,
    requestFn: (accessToken: string) => Promise<T>,
  ): Promise<T> {
    let accessToken = await this.getValidAccessToken(account);

    try {
      return await requestFn(accessToken);
    } catch (error) {
      // Check if it's a 401 Unauthorized error
      if (
        isAxiosError(error) &&
        error.response?.status === 401 &&
        account.refreshToken
      ) {
        this.logger.warn(
          `Access token invalid for Strava account ${account.providerAccountId}, refreshing...`,
        );

        // Refresh the token
        const tokenResponse = await this.refreshAccessToken(
          account.refreshToken,
        );

        // Update the account in database
        const updatedAccount = await this.prisma.providerAccount.update({
          where: {
            providerAccountId: account.providerAccountId,
          },
          data: {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token ?? account.refreshToken,
            expiresAt: null, // Strava tokens don't expire
          },
        });

        // Update the account object for potential retry and subsequent calls
        account.accessToken = updatedAccount.accessToken;
        account.refreshToken = updatedAccount.refreshToken;
        account.expiresAt = updatedAccount.expiresAt;

        // Retry the request with the new token
        accessToken = tokenResponse.access_token;
        return await requestFn(accessToken);
      }

      // Re-throw if it's not a 401 or if we can't refresh
      throw error;
    }
  }

  /**
   * Complete OAuth flow and save account
   */
  async connect(user: AuthUser, code: string): Promise<ProviderAccount> {
    const tokenResponse = await this.exchangeCodeForTokens(code);

    // Get athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: user.userId },
      include: { user: true },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    // Extract external user ID from Strava response
    // Strava includes athlete data in the token response
    const tokenData = tokenResponse;
    const externalUserId = tokenData.athlete?.id?.toString();

    // Save provider account
    const account = await this.saveProviderAccount({
      athleteId: athlete.athleteId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? '',
      scopes: tokenResponse.scope,
      externalUserId,
    });

    return account;
  }

  /**
   * Import activities from Strava
   */
  async importActivities(
    account: ProviderAccount,
    options?: ImportOptions,
  ): Promise<ImportedActivity[]> {
    let page = 1;
    const limit = options?.limit ?? Number.POSITIVE_INFINITY;
    const activities: ImportedActivity[] = [];

    while (activities.length < limit) {
      const data = await this.makeAuthenticatedRequest<StravaSummaryActivity[]>(
        account,
        async (accessToken) => {
          const response = await axios.get<StravaSummaryActivity[]>(
            `https://www.strava.com/api/v3/athlete/activities?page=${page}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              timeout: 15000, // 15 seconds timeout for activities list
            },
          );
          return response.data;
        },
      );

      if (data.length === 0) break;

      for (const activity of data) {
        if (activities.length >= limit) break;

        const startDate = new Date(activity.start_date);
        const endDate = new Date(startDate);
        endDate.setSeconds(endDate.getSeconds() + activity.elapsed_time);

        // Apply date filters if provided
        if (options?.startDate && startDate < options.startDate) continue;
        if (options?.endDate && startDate > options.endDate) continue;

        activities.push({
          externalId: activity.id.toString(),
          name: activity.name,
          startDate,
          endDate,
          sport: mapStravaSportType(activity.type),
          distance: activity.distance,
          duration: activity.elapsed_time,
          raw: activity,
        });
      }

      page++;
    }

    return activities;
  }

  /**
   * Import and save a single activity
   */
  async importActivity(
    account: ProviderAccount,
    activity: ImportedActivity,
  ): Promise<EventActivity> {
    // Check if already imported
    // TODO: After migration, use findUnique with external_id unique index
    const existing = await this.prisma.eventActivity.findFirst({
      where: {
        externalId: activity.externalId,
      },
    });

    if (existing) {
      return existing;
    }

    // Get athlete (only need athleteId, no need for user relation)
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: account.athleteId },
      select: { athleteId: true },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    // Create event
    const event = await this.prisma.event.create({
      data: {
        athleteId: athlete.athleteId,
        name: activity.name,
        type: EventType.ACTIVITY,
        startDate: activity.startDate,
        endDate: activity.endDate,
      },
    });

    // Fetch full activity data with streams
    const stravaActivity = activity.raw as StravaSummaryActivity;
    const savedActivity = await this.fetchStravaActivityData(
      account,
      event,
      stravaActivity,
    );

    return savedActivity;
  }

  /**
   * Fetch full activity data with streams (from original StravaConnectorService)
   */
  private async fetchStravaActivityData(
    account: ProviderAccount,
    event: { eventId: number },
    activity: StravaSummaryActivity,
  ): Promise<EventActivity> {
    const shouldFetchStreams = !activity.manual;

    let streams: StravaSteam[] = [];

    if (shouldFetchStreams) {
      streams = await this.makeAuthenticatedRequest<StravaSteam[]>(
        account,
        async (accessToken) => {
          try {
            const response = await axios.get(
              `https://www.strava.com/api/v3/activities/${activity.id}/streams`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                params: {
                  keys: 'time,distance,latlng,altitude,heartrate,cadence,watts,temp',
                },
                timeout: 45000, // 45 seconds timeout for stream fetching (increased for large activities)
              },
            );
            return response.data;
          } catch (error) {
            this.logger.error(
              `Error fetching Strava activity data for activity ${activity.id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            return [];
          }
        },
      );
    } else {
      this.logger.warn(
        `Skipping stream fetch for Strava activity ${activity.id} (manual: ${activity.manual}, hasPolyline: ${!!activity.map?.summary_polyline?.length}, distance: ${activity.distance})`,
      );
    }

    const mergedData: ActivityStream = {};
    for (const stream of streams) {
      const key = stream.type as keyof ActivityStream;
      if (key === 'latlng') {
        mergedData[key] = stream.data as number[][];
      } else {
        mergedData[key] = stream.data as number[];
      }
    }

    const compressionStart = Date.now();
    const compressedActivityStream = compressActivityStream(mergedData);
    const compressionTime = Date.now() - compressionStart;
    if (compressionTime > 1000) {
      this.logger.debug(
        `Stream compression took ${compressionTime}ms for activity ${activity.id}`,
      );
    }

    const sport = mapStravaSportType(activity.type);

    const savedActivity = await this.prisma.eventActivity.create({
      data: {
        provider: ConnectorProvider.STRAVA,
        distance: roundDistance(activity.distance),
        elevationGain: roundElevation(activity.total_elevation_gain),
        movingTime: activity.moving_time,
        averageSpeed: roundSpeed(activity.average_speed) ?? 0,
        maxSpeed: roundSpeed(activity.max_speed) ?? 0,
        averageCadence: roundCadence(activity.average_cadence),
        averageWatts: roundPower(activity.average_watts),
        maxWatts: roundPower(activity.max_watts),
        weightedAverageWatts: roundPower(activity.weighted_average_watts),
        averageHeartrate: roundHeartrate(activity.average_heartrate),
        maxHeartrate: roundHeartrate(activity.max_heartrate),
        kilojoules: roundEnergy(activity.kilojoules),
        sport,
        stream: compressedActivityStream as object,
        externalId: activity.id.toString(),
        event: {
          connect: {
            eventId: event.eventId,
          },
        },
      },
    });

    return savedActivity;
  }

  /**
   * Import initial activities from Strava when connecting
   * Fetches activities and adds them to the import queue
   */
  async queueFullImport(account: ProviderAccount): Promise<FullImportResult> {
    this.logger.log(
      `Queueing Strava historical import for account ${account.providerAccountId}`,
    );

    try {
      // Fetch all activities using importActivities
      const activities = await this.importActivities(account);

      this.logger.log(
        `Fetched ${activities.length} activities from Strava for account ${account.providerAccountId}`,
      );

      if (activities.length === 0) {
        this.logger.log('No new activities to import');
        return { queuedActivities: 0 };
      }

      const queued = await this.enqueueActivities(account, activities);

      this.logger.log(
        `Successfully queued ${queued} activities for import (out of ${activities.length} total)`,
      );

      return { queuedActivities: queued };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';

      this.logger.error(
        `Error in queueFullImport for account ${account.providerAccountId}: ${errorName}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Re-throw to be caught by the caller
      throw error;
    }
  }

  private async enqueueActivities(
    account: ProviderAccount,
    activities: ImportedActivity[],
  ): Promise<number> {
    if (activities.length === 0) {
      return 0;
    }

    const existingExternalIds = await this.prisma.eventActivity.findMany({
      where: {
        externalId: {
          in: activities.map((a) => a.externalId),
        },
      },
      select: {
        externalId: true,
      },
    });

    const existingIdsSet = new Set(
      existingExternalIds.map((a) => a.externalId),
    );

    const newActivities = activities.filter(
      (a) => !existingIdsSet.has(a.externalId),
    );

    if (newActivities.length === 0) {
      this.logger.log('All activities already imported');
      return 0;
    }

    await this.queueService.addActivityImportJobs(account, newActivities, true);
    return newActivities.length;
  }

  /**
   * Handle Strava webhook
   */
  async handleWebhook(payload: {
    objectId: number;
    ownerId: number;
    aspectType: 'create' | 'delete';
  }): Promise<void> {
    if (
      payload.aspectType === 'create' &&
      payload.objectId &&
      payload.ownerId
    ) {
      // Find account by external_user_id (Strava athlete ID)
      const account = await this.prisma.providerAccount.findFirst({
        where: {
          provider: ConnectorProvider.STRAVA,
          externalUserId: payload.ownerId.toString(),
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
          `No active Strava account found for owner_id ${payload.ownerId}`,
        );
        return;
      }

      if (!account.importActivitiesEnabled) {
        this.logger.debug(
          `Import disabled for Strava account ${account.providerAccountId}, skipping webhook activity ${payload.objectId}`,
        );
        return;
      }

      // Check if activity already imported
      const existingActivity = await this.prisma.eventActivity.findFirst({
        where: {
          externalId: payload.objectId.toString(),
        },
      });

      if (existingActivity) {
        this.logger.debug(
          `Activity ${payload.objectId} already imported, skipping`,
        );
        return;
      }

      // Fetch activity details from Strava
      const activity =
        await this.makeAuthenticatedRequest<StravaSummaryActivity>(
          account,
          async (accessToken) => {
            const response = await axios.get<StravaSummaryActivity>(
              `https://www.strava.com/api/v3/activities/${payload.objectId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                timeout: 15000, // 15 seconds timeout for activity details
              },
            );
            return response.data;
          },
        );

      const endDate = new Date(activity.start_date);
      endDate.setSeconds(endDate.getSeconds() + activity.elapsed_time);

      const importedActivity: ImportedActivity = {
        externalId: activity.id.toString(),
        name: activity.name,
        startDate: new Date(activity.start_date),
        endDate,
        sport: mapStravaSportType(activity.type),
        distance: activity.distance,
        duration: activity.elapsed_time,
        raw: activity,
      };

      await this.queueService.addActivityImportJob(
        account,
        importedActivity,
        false,
      );

      this.logger.log(
        `Queued activity ${payload.objectId} from webhook for import`,
      );
    }
  }
}
