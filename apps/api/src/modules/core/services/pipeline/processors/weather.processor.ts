import { Injectable, Logger } from '@nestjs/common';

import { ActivityStream } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { uncompressActivityStream } from '../../../helpers/activity-stream';
import { WeatherService } from '../../weather/weather.service';
import { ActivityPipelineContext, ActivityProcessor } from '../types';

@Injectable()
export class WeatherProcessor implements ActivityProcessor {
  name = 'weather';
  private readonly logger = new Logger(WeatherProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly weather: WeatherService,
  ) {}

  async run(ctx: ActivityPipelineContext) {
    this.logger.log(
      `Weather processor running for activity ${ctx.eventActivityId}`,
    );

    // Load activity and event
    const activity = await this.prisma.event_activity.findUnique({
      where: { event_activity_id: ctx.eventActivityId },
      include: { event: true },
    });
    if (!activity || !activity.stream || !activity.event) return;

    // Determine sampling resolution (meters)
    const resolutionM = 500; // could be read from config later

    // Decode the activity stream
    const stream = uncompressActivityStream(activity.stream as ActivityStream);
    const latlng = (stream['latlng'] as Array<[number, number]>) || [];
    const dist = stream['distance'] as number[] | undefined;
    const time = stream['time'] as number[] | undefined;

    if (!latlng.length || !dist?.length || !time?.length) return;

    // Build regular sampling at resolutionM
    const totalDist = dist[dist.length - 1];
    const points: {
      lat: number;
      lon: number;
      distM: number;
      timeSec: number;
    }[] = [];
    let target = 0;
    let i = 0;
    while (target <= totalDist + 1e-6) {
      while (i < dist.length && dist[i] < target) i++;
      const idx = Math.min(i, dist.length - 1);
      const coord =
        latlng[Math.min(idx, latlng.length - 1)] || latlng[latlng.length - 1];
      const [lat, lon] = coord || [0, 0];
      points.push({ lat, lon, distM: target, timeSec: time[idx] ?? 0 });
      target += resolutionM;
    }

    // Call provider
    const samples = await this.weather.fetch({
      startDate: activity.event.start_date,
      points,
    });

    // Persist in event_activity_weather (upsert 1-1)
    await this.prisma.event_activity_weather.upsert({
      where: { event_activity_id: activity.event_activity_id },
      update: {
        resolution_m: resolutionM,
        provider: this.weather.providerName,
        samples: samples,
      },
      create: {
        event_activity: {
          connect: { event_activity_id: activity.event_activity_id },
        },
        resolution_m: resolutionM,
        provider: this.weather.providerName,
        samples: samples,
      },
    });
  }
}
