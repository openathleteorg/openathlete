import { Injectable, Logger } from '@nestjs/common';

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

  async fetchSamples(q: WeatherQuery): Promise<WeatherSample[]> {
    if (!q.points.length) return [];
    // Group by UTC day to limit calls
    const byDay = new Map<
      string,
      { lat: number; lon: number; idx: number }[]
    >();
    const dayUtc = (d: Date) => {
      const dt = new Date(d.getTime());
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const isoHourUtc = (d: Date) => {
      const t = new Date(d.getTime());
      t.setUTCMinutes(0, 0, 0);
      return t.toISOString().substring(0, 13) + ':00:00Z';
    };

    // Precompute per point the absolute date
    const pointsWithDate = q.points.map((p) => ({
      ...p,
      date: new Date(q.startDate.getTime() + p.timeSec * 1000),
    }));

    // We fetch per point to respect spatial variability, but batch per day
    // A more advanced version could cluster nearby points.

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
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', item.lat.toString());
        url.searchParams.set('longitude', item.lon.toString());
        url.searchParams.set(
          'hourly',
          [
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
          ].join(','),
        );
        url.searchParams.set('timezone', 'UTC');
        url.searchParams.set('start_date', day);
        url.searchParams.set('end_date', day);

        let res: Response | undefined;
        let attempt = 0;
        while (attempt < 2) {
          res = await fetch(url.toString());
          if (res.ok) break;
          if (res.status === 429) {
            await new Promise((r) => setTimeout(r, 2000));
            attempt++;
            continue;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        if (!res || !res.ok) throw new Error(`HTTP ${res?.status}`);
        const data: any = await res.json();
        const hourly: Hourly = data?.hourly || { time: [] };

        const tIso = isoHourUtc(p.date);
        // Locate base hour index
        const times = hourly.time.map((t) => (t.endsWith('Z') ? t : `${t}Z`));
        const idx = times.findIndex((t) => t === tIso);
        const i0 = idx >= 0 ? idx : 0;
        const i1 = Math.min(i0 + 1, times.length - 1);
        const t0 = Date.parse(times[i0] ?? tIso);
        const t1 = Date.parse(times[i1] ?? tIso);
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
}
