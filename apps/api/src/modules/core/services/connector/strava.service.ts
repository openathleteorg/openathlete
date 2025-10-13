import axios, { isAxiosError } from 'axios';
import { Request, Response } from 'express';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  connector,
  connector_provider,
  event,
  event_activity,
  event_type,
  user,
} from '@openathlete/database';
import { ActivityStream, ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityImportedEvent } from 'src/events';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { compressActivityStream } from '../../helpers/activity-stream';
import { computeRecords } from '../../helpers/record';
import { mapStravaSportType } from '../../helpers/strava';
import { StravaSummaryActivity } from '../../types/connector';

@Injectable()
export class StravaConnectorService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private eventEmitter: EventEmitter2,
  ) {}

  getStravaUri(): string {
    return `https://www.strava.com/oauth/authorize?client_id=${this.configService.get(
      'STRAVA_CLIENT_ID',
    )}&redirect_uri=${this.configService.get(
      'STRAVA_REDIRECT_URI',
    )}&response_type=code&scope=read,activity:read_all`;
  }

  async setStravaToken(user: AuthUser, code: string) {
    try {
      const { data } = await axios.post(
        'https://www.strava.com/oauth/token',
        {
          client_id: this.configService.get('STRAVA_CLIENT_ID'),
          client_secret: this.configService.get('STRAVA_CLIENT_SECRET'),
          code,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const exist = await this.prisma.connector.findFirst({
        where: {
          athlete: {
            user: { user_id: user.user_id },
          },
          provider: connector_provider.STRAVA,
        },
      });

      if (!exist) {
        const connector = await this.prisma.connector.create({
          data: {
            provider: connector_provider.STRAVA,
            token: data.refresh_token,
            external_user_id: Number(data.athlete.id).toString(),
            athlete: {
              connect: {
                user_id: user.user_id,
              },
            },
          },
          include: {
            athlete: true,
          },
        });
        await this.fetchInitialStravaData(connector);
      } else {
        const connector = await this.prisma.connector.update({
          where: { connector_id: exist.connector_id },
          data: {
            external_user_id: Number(data.athlete.id).toString(),
          },
          include: {
            athlete: {
              select: {
                user_id: true,
              },
            },
          },
        });
        if (this.configService.get('NODE_ENV') === 'development') {
          await this.fetchInitialStravaData(connector);
        }
      }
    } catch (error) {
      if (isAxiosError(error)) console.error(error.response?.data);
      throw new InternalServerErrorException();
    }
  }

  async getStravaAccessToken(refreshToken: string) {
    const { data } = await axios.post(
      'https://www.strava.com/api/v3/oauth/token',
      {
        client_id: this.configService.get('STRAVA_CLIENT_ID'),
        client_secret: this.configService.get('STRAVA_CLIENT_SECRET'),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return data.access_token;
  }

  async fetchStravaActivityData(
    accessToken: string,
    event: event,
    activity: StravaSummaryActivity,
    user_id: user['user_id'],
    options?: { skipWeather?: boolean },
  ): Promise<event_activity> {
    const { data } = await axios.get(
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

    for (const stream of data) {
      mergedData[stream.type] = stream.data;
    }

    const records = computeRecords(mergedData);

    const compressedActivityStream = compressActivityStream(mergedData);

    const sport = mapStravaSportType(activity.sport_type);

    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          user_id,
        },
      },
      select: {
        athlete_id: true,
      },
    });

    if (!athlete) {
      throw new InternalServerErrorException('Athlete not found');
    }

    const defaultEquipment = await this.prisma.equipment.findFirst({
      where: {
        athlete_id: athlete.athlete_id,
        sports: {
          has: sport,
        },
        is_default: true,
      },
    });

    const savedActivity = await this.prisma.event_activity.create({
      data: {
        provider: connector_provider.STRAVA,
        distance: activity.distance,
        elevation_gain: activity.total_elevation_gain,
        moving_time: activity.moving_time,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_cadence: activity.average_cadence,
        average_watts: activity.average_watts,
        max_watts: activity.max_watts,
        weighted_average_watts: activity.weighted_average_watts,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        kilojoules: activity.kilojoules,
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

    // Emit post-import event to trigger processing pipeline
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
            increment: activity.distance,
          },
        },
      });
    }

    if (records.length > 0) {
      await this.prisma.record.createMany({
        data: records.map((record) => ({
          ...record,
          date: event.start_date,
          event_activity_id: savedActivity.event_activity_id,
          athlete_id: athlete.athlete_id,
        })),
      });
    }

    return savedActivity;
  }

  async fetchInitialStravaData(
    connector: connector & { athlete: { user_id: number } },
  ) {
    const accessToken = await this.getStravaAccessToken(connector.token);
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
        const endDate = new Date(activity.start_date);
        endDate.setSeconds(endDate.getSeconds() + activity.elapsed_time);

        const existingActivity = await this.prisma.event_activity.findFirst({
          where: {
            external_id: activity.id.toString(),
          },
        });

        if (existingActivity) {
          continue;
        }

        const event = await this.prisma.event.create({
          data: {
            athlete: {
              connect: {
                user_id: connector.athlete.user_id,
              },
            },
            name: activity.name,
            type: event_type.ACTIVITY,
            start_date: new Date(activity.start_date),
            end_date: endDate,
          },
        });

        // Skip weather enrichment for bulk initial import to save API calls
        await this.fetchStravaActivityData(
          accessToken,
          event,
          activity,
          connector.athlete.user_id,
          { skipWeather: true },
        );

        // break; // TODO: Remove this break
      }

      page++;

      // break; // TODO: Remove this break
    }
  }

  async stravaWebhookGet(req: Request, res: Response) {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    if (mode && token) {
      if (
        mode === 'subscribe' &&
        token === this.configService.get('STRAVA_WEBHOOK_TOKEN')
      ) {
        res.json({ 'hub.challenge': challenge });
      } else {
        res.sendStatus(403);
      }
    }
  }

  async stravaWebhookPost(body: {
    object_id: number;
    owner_id: number;
    aspect_type: 'create' | 'delete';
  }) {
    if (body.aspect_type === 'create' && body.object_id && body.owner_id) {
      const connector = await this.prisma.connector.findFirst({
        where: {
          external_user_id: body.owner_id.toString(),
        },
        include: {
          athlete: true,
        },
      });

      if (!connector) return;

      // Fetch only the specific activity from webhook (with weather enrichment)
      const accessToken = await this.getStravaAccessToken(connector.token);
      
      // Check if activity already exists
      const existingActivity = await this.prisma.event_activity.findFirst({
        where: {
          external_id: body.object_id.toString(),
        },
      });

      if (existingActivity) return;

      // Fetch activity details from Strava
      const { data: activity } = await axios.get<StravaSummaryActivity>(
        `https://www.strava.com/api/v3/activities/${body.object_id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const endDate = new Date(activity.start_date);
      endDate.setSeconds(endDate.getSeconds() + activity.elapsed_time);

      const event = await this.prisma.event.create({
        data: {
          athlete: {
            connect: {
              user_id: connector.athlete.user_id,
            },
          },
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
        connector.athlete.user_id,
      );
    }
  }
}
