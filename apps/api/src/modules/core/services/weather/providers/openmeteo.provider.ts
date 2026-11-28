import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { WeatherProvider, WeatherQuery, WeatherSample } from './types';

type Hourly = {
  time: string[];
  temperature_2m?: number[];
  apparent_temperature?: number[];
  relative_humidity_2m?: number[];
  precipitation?: number[];
  rain?: number[];
  snowfall?: number[];
  cloudcover?: number[];
  windspeed_10m?: number[];
  windgusts_10m?: number[];
  shortwave_radiation?: number[];
  sunshine_duration?: number[];
  is_day?: number[];
};

@Injectable()
export class OpenMeteoWeatherProvider implements WeatherProvider {
  name = 'openmeteo';
  private readonly logger = new Logger(OpenMeteoWeatherProvider.name);
  private readonly forecastUrl: string;
  private readonly archiveUrl: string;

  constructor(configService: ConfigService<ApiEnvSchemaType, true>) {
    const base = configService.get('OPEN_METEO_BASE_URL', { infer: true });
    const root = base?.replace(/\/+$/, '');
    this.forecastUrl = `${root ?? 'https://api.open-meteo.com'}/v1/forecast`;
    this.archiveUrl = `${root ?? 'https://archive-api.open-meteo.com'}/v1/archive`;
  }

  async fetchSamples(q: WeatherQuery): Promise<WeatherSample[]> {
    if (!q.points.length) return [];
    // Group by UTC day to limit calls
    const byDay = new Map<
      string,
      { lat: number; lon: number; idx: number }[]
    >();
    /**
     * Extract UTC date string in YYYY-MM-DD format
     * This ensures we're always working in UTC timezone
     */
    const dayUtc = (d: Date): string => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    /**
     * Round date to hour in UTC and format as ISO string
     * Result format: YYYY-MM-DDTHH:00:00Z
     * This matches the format returned by OpenMeteo when timezone=UTC
     */
    const isoHourUtc = (d: Date): string => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const hh = String(d.getUTCHours()).padStart(2, '0');
      return `${y}-${m}-${dd}T${hh}:00:00Z`;
    };

    // Precompute per point the absolute date
    const pointsWithDate = q.points.map((p) => ({
      ...p,
      date: new Date(q.startDate.getTime() + p.timeSec * 1000),
    }));

    // One request per grid cell and day, shared by the points that fall in it
    const cells = new Map<string, Promise<Hourly>>();

    const out: WeatherSample[] = new Array(pointsWithDate.length);
    for (let i = 0; i < pointsWithDate.length; i++) {
      const p = pointsWithDate[i];
      const day = dayUtc(p.date);
      const list = byDay.get(day) || [];
      list.push({ lat: p.lat, lon: p.lon, idx: i });
      byDay.set(day, list);
    }

    // For each day, fetch each point's hourly bundle and interpolate to the instant
    for (const [day, items] of byDay.entries()) {
      for (const item of items) {
        const i = item.idx;
        const p = pointsWithDate[i];

        // Determine if we need historical data (archive) or forecast
        // Archive API is available for dates older than ~5 days
        // For recent past (last few days), we still use forecast as archive may not be available yet
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - p.date.getTime()) / (1000 * 60 * 60 * 24),
        );
        const useArchive = daysDiff > 1;

        const hourly = await this.hourlyForCell(
          cells,
          useArchive,
          day,
          item.lat,
          item.lon,
        );

        // Convert point date to target hour in UTC
        const tIso = isoHourUtc(p.date);

        // Normalize all time strings from API to ISO format with Z suffix
        // OpenMeteo returns times like "2025-10-06T14:00" when timezone=UTC is set
        const times = hourly.time.map((t) => {
          // If already has Z, return as is
          if (t.endsWith('Z')) return t;
          // If it's in format "YYYY-MM-DDTHH:MM", add :00Z
          if (t.length === 16 && t.includes('T')) return `${t}:00Z`;
          // If it's in format "YYYY-MM-DDTHH:MM:SS", add Z
          if (t.length === 19 && t.includes('T')) return `${t}Z`;
          // Fallback: assume it's UTC and add Z
          return `${t}Z`;
        });

        // Find the hour slot that matches our target time
        const idx = times.findIndex((t) => t === tIso);

        // Log for debugging timezone issues
        if (idx < 0) {
          this.logger.warn(
            `Could not find exact hour match. Target: ${tIso}, Available hours: ${times.slice(0, 3).join(', ')}...`,
          );
        }

        // Use the found index or fallback to closest hour
        let i0: number;
        let i1: number;

        if (idx >= 0) {
          // Exact match found
          i0 = idx;
          i1 = Math.min(idx + 1, times.length - 1);
        } else {
          // No exact match - find the closest hour before the target
          const targetTime = p.date.getTime();
          i0 = 0;
          for (let j = 0; j < times.length; j++) {
            const timeMs = Date.parse(times[j]);
            if (timeMs <= targetTime) {
              i0 = j;
            } else {
              break;
            }
          }
          i1 = Math.min(i0 + 1, times.length - 1);
        }

        // Parse timestamps for interpolation
        const t0 = Date.parse(times[i0]);
        const t1 = Date.parse(times[i1]);

        // Calculate interpolation factor (0 to 1)
        const f =
          t1 > t0
            ? Math.min(1, Math.max(0, (p.date.getTime() - t0) / (t1 - t0)))
            : 0;
        const lerp = (a?: number, b?: number) =>
          typeof a === 'number' && typeof b === 'number'
            ? a + f * (b - a)
            : (a ?? b);

        out[i] = {
          distM: p.distM,
          timeSec: p.timeSec,
          lat: p.lat,
          lon: p.lon,
          temperatureC: lerp(
            hourly.temperature_2m?.[i0],
            hourly.temperature_2m?.[i1],
          ),
          apparentTemperatureC: lerp(
            hourly.apparent_temperature?.[i0],
            hourly.apparent_temperature?.[i1],
          ),
          humidityPct: lerp(
            hourly.relative_humidity_2m?.[i0],
            hourly.relative_humidity_2m?.[i1],
          ),
          precipitationMm: lerp(
            hourly.precipitation?.[i0],
            hourly.precipitation?.[i1],
          ),
          rainMm: lerp(hourly.rain?.[i0], hourly.rain?.[i1]),
          snowfallCm: lerp(hourly.snowfall?.[i0], hourly.snowfall?.[i1]),
          cloudCoverPct: lerp(hourly.cloudcover?.[i0], hourly.cloudcover?.[i1]),
          windSpeed10mKmh: lerp(
            hourly.windspeed_10m?.[i0],
            hourly.windspeed_10m?.[i1],
          ),
          windGusts10mKmh: lerp(
            hourly.windgusts_10m?.[i0],
            hourly.windgusts_10m?.[i1],
          ),
          shortwaveRadiationWm2: lerp(
            hourly.shortwave_radiation?.[i0],
            hourly.shortwave_radiation?.[i1],
          ),
          sunshineDurationSec: lerp(
            hourly.sunshine_duration?.[i0],
            hourly.sunshine_duration?.[i1],
          ),
          isDay:
            typeof hourly.is_day?.[i0] === 'number'
              ? (f < 0.5 ? hourly.is_day?.[i0] : hourly.is_day?.[i1]) === 1
              : undefined,
        };
      }
    }

    return out;
  }

  /**
   * The hourly bundle of the grid cell around a point. Points come every
   * 500 m and loops pass the same places again, while the weather models are
   * no finer than a few kilometres: asking once per cell and day keeps a long
   * activity from spending dozens of calls of Open-Meteo's free quota on
   * identical answers.
   */
  private hourlyForCell(
    cells: Map<string, Promise<Hourly>>,
    archive: boolean,
    day: string,
    lat: number,
    lon: number,
  ): Promise<Hourly> {
    const cellLat = (Math.round(lat / CELL_DEGREES) * CELL_DEGREES).toFixed(2);
    const cellLon = (Math.round(lon / CELL_DEGREES) * CELL_DEGREES).toFixed(2);
    const key = `${archive}|${day}|${cellLat}|${cellLon}`;
    let hourly = cells.get(key);
    if (!hourly) {
      const url = new URL(archive ? this.archiveUrl : this.forecastUrl);
      url.searchParams.set('latitude', cellLat);
      url.searchParams.set('longitude', cellLon);
      url.searchParams.set('hourly', HOURLY_VARIABLES.join(','));
      url.searchParams.set('timezone', 'UTC');
      url.searchParams.set('start_date', day);
      url.searchParams.set('end_date', day);
      hourly = this.request(url);
      cells.set(key, hourly);
    }
    return hourly;
  }

  // Only busy (429) and unavailable (5xx) answers get a second try
  private async request(url: URL): Promise<Hourly> {
    for (let attempt = 0; ; attempt++) {
      const signal = AbortSignal.timeout(this.timeoutMs);
      const res = await this.fetchWithin(url, signal);
      if (res.ok) return this.readHourly(res, signal);
      // An unread body holds the socket until garbage collection
      await res.body?.cancel().catch(() => undefined);
      if ((res.status !== 429 && res.status < 500) || attempt >= 1)
        throw new Error(`HTTP ${res.status}`);
      await new Promise((r) => setTimeout(r, this.retryDelayMs));
    }
  }

  private async fetchWithin(url: URL, signal: AbortSignal): Promise<Response> {
    try {
      return await fetch(url.toString(), { signal });
    } catch (err) {
      throw this.failure(err, signal);
    }
  }

  // The body is read under the same signal, so a stalled body also times out
  private async readHourly(
    res: Response,
    signal: AbortSignal,
  ): Promise<Hourly> {
    let data: unknown;
    try {
      data = await res.json();
    } catch (err) {
      if (signal.aborted) throw this.failure(err, signal);
      throw new Error('Open-Meteo returned a non-JSON body');
    }
    return (data as { hourly?: Hourly })?.hourly || { time: [] };
  }

  private failure(err: unknown, signal: AbortSignal): Error {
    if (signal.aborted)
      return new Error(`Open-Meteo timed out after ${this.timeoutMs}ms`);
    const message = err instanceof Error ? err.message : String(err);
    // fetch says only "fetch failed": the reason (ENOTFOUND, ECONNREFUSED) is in its cause
    const reason = causeReason(err);
    return Object.assign(
      new Error(
        `Open-Meteo request failed: ${message}${reason ? ` (${reason})` : ''}`,
      ),
      { cause: err },
    );
  }

  protected retryDelayMs = 2000;
  protected timeoutMs = 10_000;
}

function causeReason(err: unknown): string | undefined {
  const cause = (err as { cause?: unknown } | null)?.cause;
  if (!cause || typeof cause !== 'object') return undefined;
  const { code, message } = cause as { code?: unknown; message?: unknown };
  if (typeof code === 'string') return code;
  return typeof message === 'string' ? message : undefined;
}

/** About 2 km: as fine as the finest models Open-Meteo serves in Europe */
const CELL_DEGREES = 0.02;

const HOURLY_VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'rain',
  'snowfall',
  'cloudcover',
  'windspeed_10m',
  'windgusts_10m',
  'shortwave_radiation',
  'sunshine_duration',
  'is_day',
];
