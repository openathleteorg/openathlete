import axios, { isAxiosError } from 'axios';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  connector_provider,
  event_activity,
  event_type,
  provider_account,
} from '@openathlete/database';
import { ActivityStream, ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityImportedEvent } from 'src/events';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { compressActivityStream } from '../../core/helpers/activity-stream';
import { computeRecords } from '../../core/helpers/record';
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
import { StravaSummaryActivity } from '../../core/types/connector';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  BaseProviderService,
  OAuthConfig,
  OAuthTokenResponse,
} from '../base/base-provider.service';
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
  protected readonly provider = connector_provider.STRAVA;

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
    private readonly eventEmitter: EventEmitter2,
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
    account: provider_account,
  ): Promise<string> {
    // Strava access tokens don't expire (or expire very rarely)
    // So we can use stored token if it exists
    if (account.access_token) {
      return account.access_token;
    }

    // Otherwise refresh (will generate new access token)
    if (!account.refresh_token) {
      throw new Error('No refresh token available for Strava');
    }

    this.logger.debug(
      `Refreshing Strava access token for athlete ${account.athlete_id}`,
    );

    const tokenResponse = await this.refreshAccessToken(account.refresh_token);

    // Strava doesn't provide expires_in, so we set expires_at to null
    await this.prisma.provider_account.update({
      where: {
        provider_account_id: account.provider_account_id,
      },
      data: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token ?? account.refresh_token,
        expires_at: null, // Strava tokens don't expire
      },
    });

    return tokenResponse.access_token;
  }

  /**
   * Complete OAuth flow and save account
   */
  async connect(user: AuthUser, code: string): Promise<provider_account> {
    const tokenResponse = await this.exchangeCodeForTokens(code);

    // Get athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id: user.user_id },
      include: { user: true },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    // Extract external user ID from Strava response
    // Strava includes athlete data in the token response
    const tokenData = tokenResponse as any;
    const externalUserId = tokenData.athlete?.id?.toString();

    // Save provider account
    const account = await this.saveProviderAccount({
      athleteId: athlete.athlete_id,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? '',
      scopes: tokenResponse.scope,
      externalUserId,
    });

    // Import initial activities (skip weather for bulk import)
    await this.fetchInitialStravaData(account);

    return account;
  }

  /**
   * Import activities from Strava
   */
  async importActivities(
    account: provider_account,
    options?: ImportOptions,
  ): Promise<ImportedActivity[]> {
    const accessToken = await this.getValidAccessToken(account);

    let page = 1;
    const limit = options?.limit ?? 100;
    const activities: ImportedActivity[] = [];

    while (activities.length < limit) {
      const { data } = await axios.get<StravaSummaryActivity[]>(
        `https://www.strava.com/api/v3/athlete/activities?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
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
    account: provider_account,
    activity: ImportedActivity,
  ): Promise<event_activity> {
    const accessToken = await this.getValidAccessToken(account);

    // Check if already imported
    const existing = await this.prisma.event_activity.findFirst({
      where: {
        external_id: activity.externalId,
      },
    });

    if (existing) {
      return existing;
    }

    // Get athlete
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: account.athlete_id },
      include: { user: true },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    // Create event
    const event = await this.prisma.event.create({
      data: {
        athlete_id: athlete.athlete_id,
        name: activity.name,
        type: event_type.ACTIVITY,
        start_date: activity.startDate,
        end_date: activity.endDate,
      },
    });

    // Fetch full activity data with streams
    const stravaActivity = activity.raw as StravaSummaryActivity;
    const savedActivity = await this.fetchStravaActivityData(
      accessToken,
      event,
      stravaActivity,
      athlete.user_id,
    );

    return savedActivity;
  }

  /**
   * Fetch full activity data with streams (from original StravaConnectorService)
   */
  private async fetchStravaActivityData(
    accessToken: string,
    event: { event_id: number },
    activity: StravaSummaryActivity,
    user_id: number,
    options?: { skipWeather?: boolean },
  ): Promise<event_activity> {
    const { data: streams } = await axios.get(
      `https://www.strava.com/api/v3/activities/${activity.id}/streams`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          keys: 'time,distance,latlng,altitude,heartrate,cadence,watts,temp',
        },
      },
    );

    const mergedData: ActivityStream = {};
    for (const stream of streams) {
      mergedData[stream.type] = stream.data;
    }

    const compressedActivityStream = compressActivityStream(mergedData);

    const sport = mapStravaSportType(activity.type);
    const records = computeRecords(mergedData);

    const athlete = await this.prisma.athlete.findUnique({
      where: { user_id },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    const defaultEquipment = await this.prisma.equipment.findFirst({
      where: {
        athlete_id: athlete.athlete_id,
        type:
          sport === 'RUNNING' || sport === 'TRAIL_RUNNING' ? 'SHOE' : 'BIKE',
        is_default: true,
      },
    });

    const savedActivity = await this.prisma.event_activity.create({
      data: {
        provider: connector_provider.STRAVA,
        distance: roundDistance(activity.distance),
        elevation_gain: roundElevation(activity.total_elevation_gain),
        moving_time: activity.moving_time,
        average_speed: roundSpeed(activity.average_speed) ?? 0,
        max_speed: roundSpeed(activity.max_speed) ?? 0,
        average_cadence: roundCadence(activity.average_cadence),
        average_watts: roundPower(activity.average_watts),
        max_watts: roundPower(activity.max_watts),
        weighted_average_watts: roundPower(activity.weighted_average_watts),
        average_heartrate: roundHeartrate(activity.average_heartrate),
        max_heartrate: roundHeartrate(activity.max_heartrate),
        kilojoules: roundEnergy(activity.kilojoules),
        sport,
        stream: compressedActivityStream as object,
        external_id: activity.id.toString(),
        event: {
          connect: {
            event_id: event.event_id,
          },
        },
        equipment: defaultEquipment
          ? {
              connect: {
                equipment_id: defaultEquipment.equipment_id,
              },
            }
          : undefined,
      },
    });

    // Emit event
    this.eventEmitter.emit(
      ActivityImportedEvent.SLUG,
      new ActivityImportedEvent({
        eventActivityId: savedActivity.event_activity_id,
        eventId: event.event_id,
        skipWeather: options?.skipWeather,
      }),
    );

    if (defaultEquipment) {
      await this.prisma.equipment.update({
        where: {
          equipment_id: defaultEquipment.equipment_id,
        },
        data: {
          total_distance: {
            increment: roundDistance(activity.distance),
          },
        },
      });
    }

    if (records.length > 0) {
      await this.prisma.record.createMany({
        data: records.map((record) => ({
          ...record,
          date: new Date(activity.start_date),
          event_activity_id: savedActivity.event_activity_id,
          athlete_id: athlete.athlete_id,
        })),
      });
    }

    return savedActivity;
  }

  /**
   * Import initial activities from Strava when connecting
   * Similar to fetchInitialStravaData from old StravaConnectorService
   */
  private async fetchInitialStravaData(
    account: provider_account,
  ): Promise<void> {
    const accessToken = await this.getValidAccessToken(account);

    // Get athlete with user for user_id
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: account.athlete_id },
      include: { user: true },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    let page = 1;
    let hasMoreData = true;

    while (hasMoreData) {
      const { data } = await axios.get<StravaSummaryActivity[]>(
        `https://www.strava.com/api/v3/athlete/activities?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (data.length === 0) {
        hasMoreData = false;
        break;
      }

      for (const activity of data) {
        // Check if activity already exists
        const existingActivity = await this.prisma.event_activity.findFirst({
          where: {
            external_id: activity.id.toString(),
          },
        });

        if (existingActivity) {
          continue;
        }

        const endDate = new Date(activity.start_date);
        endDate.setSeconds(endDate.getSeconds() + activity.elapsed_time);

        // Create event
        const event = await this.prisma.event.create({
          data: {
            athlete_id: athlete.athlete_id,
            name: activity.name,
            type: event_type.ACTIVITY,
            start_date: new Date(activity.start_date),
            end_date: endDate,
          },
        });

        // Import activity with skipWeather=true for bulk import
        await this.fetchStravaActivityData(
          accessToken,
          event,
          activity,
          athlete.user.user_id,
          { skipWeather: true },
        );
      }

      page++;
    }
  }

  /**
   * Handle Strava webhook
   */
  async handleWebhook(payload: {
    object_id: number;
    owner_id: number;
    aspect_type: 'create' | 'delete';
  }): Promise<void> {
    if (
      payload.aspect_type === 'create' &&
      payload.object_id &&
      payload.owner_id
    ) {
      // Find account by external_user_id (Strava athlete ID)
      const account = await this.prisma.provider_account.findFirst({
        where: {
          provider: connector_provider.STRAVA,
          external_user_id: payload.owner_id.toString(),
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
          `No active Strava account found for owner_id ${payload.owner_id}`,
        );
        return;
      }

      // Check if activity already imported
      const existingActivity = await this.prisma.event_activity.findFirst({
        where: {
          external_id: payload.object_id.toString(),
        },
      });

      if (existingActivity) {
        this.logger.debug(
          `Activity ${payload.object_id} already imported, skipping`,
        );
        return;
      }

      // Fetch activity details from Strava
      const accessToken = await this.getValidAccessToken(account);
      const { data: activity } = await axios.get<StravaSummaryActivity>(
        `https://www.strava.com/api/v3/activities/${payload.object_id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const endDate = new Date(activity.start_date);
      endDate.setSeconds(endDate.getSeconds() + activity.elapsed_time);

      // Create event
      const event = await this.prisma.event.create({
        data: {
          athlete_id: account.athlete_id,
          name: activity.name,
          type: event_type.ACTIVITY,
          start_date: new Date(activity.start_date),
          end_date: endDate,
        },
      });

      // Import single activity WITH weather enrichment (no skipWeather flag)
      await this.fetchStravaActivityData(
        accessToken,
        event,
        activity,
        account.athlete.user.user_id,
      );
    }
  }
}
