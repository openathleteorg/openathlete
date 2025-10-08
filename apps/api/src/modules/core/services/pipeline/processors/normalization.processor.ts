import { Injectable, Logger } from '@nestjs/common';

import { normalization_factor, sport_type } from '@openathlete/database';
import { InputJsonValue } from '@openathlete/database/generated/client/runtime/library';
import { ActivityStream } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  compressActivityStream,
  uncompressActivityStream,
} from '../../../helpers/activity-stream';
import { ActivityPipelineContext, ActivityProcessor } from '../types';

type FilterContext = {
  // per-sample inputs
  time: number[];
  dist: number[];
  alt?: number[];
  temp?: number[];
  gap?: number[]; // from GAP processor
  // global
  movingTimeSec: number;
};

type NormFilter = {
  name: normalization_factor;
  // Returns multiplicative factor to convert observed flat-equivalent speed
  // Example: 0.98 means speed should be 2% slower due to factor
  factorAt: (i: number, ctx: FilterContext) => number;
};

// Temperature filter: simplistic polynomial around 10-12C as optimal
const temperatureFilter: NormFilter = {
  name: normalization_factor.TEMPERATURE,
  factorAt: (i, ctx) => {
    const t = ctx.temp?.[i];
    if (t == null || !Number.isFinite(t)) return 1;
    // Empirical: penalty grows when far from 12C
    const delta = t - 12; // deg C
    const pct = Math.min(0.15, Math.max(0, Math.abs(delta) * 0.005)); // max 15%
    return 1 / (1 + pct);
  },
};

// Altitude filter: crude reduction with altitude assuming aerobic impact
const altitudeFilter: NormFilter = {
  name: normalization_factor.ALTITUDE,
  factorAt: (i, ctx) => {
    const a = ctx.alt?.[i];
    if (a == null || !Number.isFinite(a)) return 1;
    // 1% per 200m above 300m, capped 12%
    const excess = Math.max(0, a - 300);
    const pct = Math.min(0.12, (excess / 200) * 0.01);
    return 1 / (1 + pct);
  },
};

// Slope filter: reuse GAP if available; otherwise neutral
const slopeFilter: NormFilter = {
  name: normalization_factor.SLOPE,
  factorAt: (i, ctx) => {
    const vGap = ctx.gap?.[i];
    if (!Number.isFinite(vGap)) return 1;
    // GAP already converted observed speed to flat-equivalent.
    // Here we do nothing (factor 1), relying on GAP stream as base.
    return 1;
  },
};

@Injectable()
export class NormalizationProcessor implements ActivityProcessor {
  name = 'normalization';
  private readonly logger = new Logger(NormalizationProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  private buildFilters(): NormFilter[] {
    return [slopeFilter, temperatureFilter, altitudeFilter];
  }

  async run(ctx: ActivityPipelineContext) {
    const activity = await this.prisma.event_activity.findUnique({
      where: { event_activity_id: ctx.eventActivityId },
      include: {
        event: true,
        weather: true,
        normalization: { include: { factors: true } },
      },
    });
    if (!activity || !activity.stream) return;

    if (
      activity.sport !== sport_type.RUNNING &&
      activity.sport !== sport_type.TRAIL_RUNNING
    ) {
      return;
    }

    this.logger.log(
      `Normalization processor running for activity ${ctx.eventActivityId}`,
    );

    const stream = uncompressActivityStream(activity.stream as ActivityStream);
    const time = stream['time'] as number[] | undefined;
    const dist = stream['distance'] as number[] | undefined;
    const alt = stream['altitude'] as number[] | undefined;
    const temp = stream['temp'] as number[] | undefined;
    const gap = stream['gap'] as number[] | undefined; // base adjusted for slope
    if (!time?.length || !dist?.length) return;

    const n = Math.min(time.length, dist.length);
    if (n < 2) return;

    // Build per-index mapping for weather to nearest distance index if present
    let tempByIndex: number[] | undefined = temp;
    if (!tempByIndex && activity.weather) {
      const samples = activity.weather.samples as unknown as Array<{
        distM: number;
        temperatureC?: number;
      }> as any[];
      if (Array.isArray(samples) && samples.length) {
        tempByIndex = new Array(n);
        let j = 0;
        for (let i = 0; i < n; i++) {
          const d = dist[i] ?? 0;
          while (j < samples.length - 1 && samples[j + 1].distM <= d) j++;
          tempByIndex[i] =
            samples[j]?.temperatureC ??
            samples[j]?.apparentTemperatureC ??
            tempByIndex[i - 1] ??
            12;
        }
      }
    }

    const filters = this.buildFilters();
    const ctxF: FilterContext = {
      time,
      dist,
      alt,
      temp: tempByIndex,
      gap,
      movingTimeSec: activity.moving_time,
    };

    const baseSpeed =
      gap ??
      (() => {
        // fallback to raw segment speed per sample (~distance derivative)
        const v: number[] = new Array(n).fill(0);
        for (let i = 1; i < n; i++) {
          const dd = (dist[i] ?? dist[i - 1]) - (dist[i - 1] ?? dist[i]);
          const dt = Math.max(
            1e-6,
            (time[i] ?? time[i - 1]) - (time[i - 1] ?? time[i]),
          );
          v[i] = dd / dt;
        }
        v[0] = v[1] ?? v[0];
        return v;
      })();

    const norm: number[] = new Array(n);

    // Per-factor cumulative time deltas
    const accumSeconds = new Map<normalization_factor, number>();
    for (const f of filters) accumSeconds.set(f.name, 0);

    for (let i = 1; i < n; i++) {
      const dt = Math.max(
        0,
        (time[i] ?? time[i - 1]) - (time[i - 1] ?? time[i]),
      );
      // multiplicative stack of penalties
      let mult = 1;
      for (const f of filters) {
        const m = f.factorAt(i, ctxF);
        if (Number.isFinite(m) && m > 0) {
          mult *= m;
        }
      }
      // Apply multiplier on base speed
      const v0 = baseSpeed[i] ?? baseSpeed[i - 1] ?? 0;
      const vN = v0 * mult;
      norm[i] = vN;

      // Convert speed multiplier to time cost at this small segment
      const baselineTime = dt; // base sample duration
      const adjustedTime = mult > 0 ? dt / mult : dt;
      const delta = adjustedTime - baselineTime; // >0 cost, <0 bonus
      // Distribute delta proportionally across filters by log contribution
      // approximate share by each filter's (1-m) magnitude
      const shares = filters.map((f) => {
        const m = f.factorAt(i, ctxF);
        return 1 - (Number.isFinite(m) && m > 0 ? m : 1);
      });
      const sumAbs = shares.reduce((s, x) => s + Math.abs(x), 0) || 1;
      for (let k = 0; k < filters.length; k++) {
        const frac = Math.abs(shares[k]) / sumAbs;
        accumSeconds.set(
          filters[k].name,
          (accumSeconds.get(filters[k].name) || 0) + delta * frac,
        );
      }
    }
    norm[0] = norm[1] ?? baseSpeed[0] ?? 0;

    // Compute average normalized speed over valid samples
    let sum = 0;
    let cnt = 0;
    for (let i = 1; i < n; i++) {
      if (Number.isFinite(norm[i])) {
        sum += norm[i];
        cnt++;
      }
    }
    const avgNorm = cnt > 0 ? sum / cnt : null;

    const newStream = { ...stream, norm } as ActivityStream;
    const compressed = compressActivityStream(newStream);

    // Upsert normalization with factors breakdown
    const factorsData = Array.from(accumSeconds.entries()).map(
      ([factor, seconds]) => ({
        factor,
        time_seconds: seconds,
        percent:
          activity.moving_time > 0 ? (seconds / activity.moving_time) * 100 : 0,
      }),
    );

    const normRow = await this.prisma.event_activity_normalization.upsert({
      where: { event_activity_id: ctx.eventActivityId },
      update: {
        average_normalized_speed: avgNorm ?? undefined,
        factors: {
          deleteMany: {},
          create: factorsData,
        },
      },
      create: {
        event_activity: { connect: { event_activity_id: ctx.eventActivityId } },
        average_normalized_speed: avgNorm ?? undefined,
        factors: { create: factorsData },
      },
      include: { factors: true },
    });

    await this.prisma.event_activity.update({
      where: { event_activity_id: ctx.eventActivityId },
      data: {
        stream: compressed as InputJsonValue,
        average_normalized_speed: avgNorm ?? undefined,
      },
    });
  }
}
