import { Injectable } from '@nestjs/common';

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
  base: number[]; // raw per-sample speed (m/s) from distance/time
  // global
  movingTimeSec: number;
};

type NormFilter = {
  name: normalization_factor;
  // Returns multiplicative factor to convert observed speed into flat-equivalent
  // Example: 1.02 means +2% speed when removing the factor penalty
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
    // Normalization removes penalty => multiplier > 1 when penalty exists
    return 1 + pct;
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
    // Normalization removes penalty => multiplier > 1 when penalty exists
    return 1 + pct;
  },
};

// Slope filter: conceptual multiplier from GAP vs base. We won't apply it when
// computing the normalized speed if GAP exists (we'll start from GAP instead),
// but we keep it to allocate cost shares accurately.
const slopeFilter: NormFilter = {
  name: normalization_factor.SLOPE,
  factorAt: (i, ctx) => {
    const v0 = ctx.base?.[i];
    const vGap = ctx.gap?.[i];
    if (
      Number.isFinite(v0) &&
      (v0 as number) > 0 &&
      Number.isFinite(vGap) &&
      (vGap as number) > 0
    ) {
      // Do NOT clamp: GAP already accounts for realistic grades. Use epsilon to avoid div-by-zero.
      const eps = 1e-6;
      const m = (vGap as number) / Math.max(v0 as number, eps);
      return Number.isFinite(m) && m > 0 ? m : 1;
    }
    // No GAP => no slope impact
    return 1;
  },
};

@Injectable()
export class NormalizationProcessor implements ActivityProcessor {
  name = 'normalization';

  constructor(private readonly prisma: PrismaService) {}

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

    // Thresholds to prevent pathological deltas when paused/very slow
    const MIN_MOVING_SPEED_MS = Number.parseFloat(
      process.env.NORMALIZATION_MIN_MOVING_SPEED_MS ?? '0.3',
    ); // ~1.08 km/h
    const MIN_SPEED_DEN_MS = Number.parseFloat(
      process.env.NORMALIZATION_MIN_SPEED_DEN_MS ?? '0.3',
    ); // denominator clamp

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

    // Raw per-step observed speed (simple dd/dt)
    const base: number[] = new Array(n).fill(0);
    for (let i = 1; i < n; i++) {
      const dd = (dist[i] ?? dist[i - 1]) - (dist[i - 1] ?? dist[i]);
      const dt = Math.max(
        1e-6,
        (time[i] ?? time[i - 1]) - (time[i - 1] ?? time[i]),
      );
      base[i] = dd / dt;
    }
    base[0] = base[1] ?? base[0];

    // Build a windowed observed speed matching the GAP window (10m half-window)
    const obsWin: number[] = new Array(n).fill(0);
    {
      const windowM = 10;
      const halfW = windowM / 2;
      let left = 0;
      let right = 0;
      for (let i = 0; i < n; i++) {
        while (left < i && dist[i] - dist[left] > halfW) left++;
        if (right < i) right = i;
        while (right < n - 1 && dist[right] - dist[i] < halfW) right++;
        let k0 = left;
        let k1 = right;
        if (k1 <= k0) {
          k0 = Math.max(0, i - 1);
          k1 = Math.min(n - 1, i + 1);
        }
        const dd = Math.max(0, (dist[k1] ?? 0) - (dist[k0] ?? 0));
        const dt = Math.max(1e-6, (time[k1] ?? 0) - (time[k0] ?? 0));
        obsWin[i] = dd / dt;
      }
      if (!Number.isFinite(obsWin[0]) && n > 1) obsWin[0] = obsWin[1];
    }

    const ctxF: FilterContext = {
      time,
      dist,
      alt,
      temp: tempByIndex,
      gap,
      base,
      movingTimeSec: activity.moving_time,
    };

    // Start from GAP if available (already slope-normalized), otherwise windowed observed speed
    const baseSpeed = gap ?? obsWin;

    const norm: number[] = new Array(n);

    // Deterministic per-factor cumulative time deltas
    let slopeSeconds = 0;
    let tempSeconds = 0;
    let altSeconds = 0;

    // Counter for skipped slow segments (not persisted; guard against pauses)
    let skippedSlow = 0;

    const safe = (v: number | undefined) =>
      Number.isFinite(v as number) && (v as number) > 0 ? (v as number) : 0;

    for (let i = 1; i < n; i++) {
      const dt = Math.max(
        0,
        (time[i] ?? time[i - 1]) - (time[i - 1] ?? time[i]),
      );
      const ds = Math.max(
        0,
        (dist[i] ?? dist[i - 1]) - (dist[i - 1] ?? dist[i]),
      );

      // Window-aligned speeds
      const vObs = safe(obsWin[i] ?? obsWin[i - 1] ?? base[i] ?? 0);
      const vGap = gap ? safe(gap[i] ?? gap[i - 1] ?? vObs) : vObs;

      // Skip delta allocation on paused/very-slow segments
      if (!(ds > 0) || vObs < MIN_MOVING_SPEED_MS) {
        skippedSlow++;
        // Still compute normalized stream below but with no delta accumulation
        const mTemp = temperatureFilter.factorAt(i, ctxF);
        const mAlt = altitudeFilter.factorAt(i, ctxF);
        const v0 = baseSpeed[i] ?? baseSpeed[i - 1] ?? 0;
        const vN =
          safe(v0) *
          (Number.isFinite(mTemp) && mTemp > 0 ? mTemp : 1) *
          (Number.isFinite(mAlt) && mAlt > 0 ? mAlt : 1);
        norm[i] = vN;
        continue;
      }

      // Multipliers (>=1 means penalty exists and normalization removes it)
      const mTemp = temperatureFilter.factorAt(i, ctxF);
      const mAlt = altitudeFilter.factorAt(i, ctxF);
      const vAfterSlope = vGap; // slope removed by GAP if present
      const vAfterTemp =
        vAfterSlope * (Number.isFinite(mTemp) && mTemp > 0 ? mTemp : 1);
      const vNorm = vAfterTemp * (Number.isFinite(mAlt) && mAlt > 0 ? mAlt : 1);

      // Segment time deltas (clamped >= 0 to reflect "perdu")
      const slopeDelta =
        ds > 0
          ? Math.max(
              0,
              ds *
                (1 / Math.max(vObs, MIN_SPEED_DEN_MS) -
                  1 / Math.max(vGap, MIN_SPEED_DEN_MS)),
            )
          : 0;
      const tempDelta =
        ds > 0
          ? Math.max(
              0,
              ds *
                (1 / Math.max(vAfterSlope, MIN_SPEED_DEN_MS) -
                  1 / Math.max(vAfterTemp, MIN_SPEED_DEN_MS)),
            )
          : 0;
      const altDelta =
        ds > 0
          ? Math.max(
              0,
              ds *
                (1 / Math.max(vAfterTemp, MIN_SPEED_DEN_MS) -
                  1 / Math.max(vNorm, MIN_SPEED_DEN_MS)),
            )
          : 0;

      slopeSeconds += slopeDelta;
      tempSeconds += tempDelta;
      altSeconds += altDelta;

      // Normalized speed stream for visualization/averaging
      const v0 = baseSpeed[i] ?? baseSpeed[i - 1] ?? 0;
      const vN =
        safe(v0) *
        (Number.isFinite(mTemp) && mTemp > 0 ? mTemp : 1) *
        (Number.isFinite(mAlt) && mAlt > 0 ? mAlt : 1);
      norm[i] = vN;
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
    const factorsData = (
      [
        [normalization_factor.SLOPE, slopeSeconds],
        [normalization_factor.TEMPERATURE, tempSeconds],
        [normalization_factor.ALTITUDE, altSeconds],
      ] as Array<[normalization_factor, number]>
    ).map(([factor, seconds]) => {
      const raw = activity.moving_time > 0 ? seconds / activity.moving_time : 0;
      const percent = Math.max(0, Math.min(1, raw));
      return { factor, time_seconds: seconds, percent };
    });

    await this.prisma.event_activity_normalization.upsert({
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
