// Open-Meteo temperature provider with in-memory and daily on-disk caching
// Fetches hourly temperature_2m and returns the value for the requested hour (UTC)
import { promises as fs } from "fs";
import path from "path";

export interface TemperatureQuery {
  date: Date; // exact timestamp; API will be queried at the hour containing this date (UTC)
  lat: number;
  lon: number;
}

// Cache key strategy:
// - DO cache only when (lat, lon, hour) are exactly the same (to avoid duplicate calls)
// - DO NOT coalesce calls within <1 km or <1 h into the same key so each close point/time remains distinct
const cache = new Map<string, Promise<number>>();
let fetchCount = 0;
const uniqueHours = new Set<string>();
// Persistent cache per UTC day under /tmp, format: /tmp/openathlete-openmeteo-cache/YYYY-MM-DD.json
const DISK_CACHE_DIR = "/tmp/openathlete-openmeteo-cache";
const diskDayCaches = new Map<string, Map<string, number>>();
const diskDayDirty = new Set<string>();
const diskDayLoadPromises = new Map<string, Promise<void>>();

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function isoHourUtc(d: Date): string {
  const dt = new Date(d.getTime());
  dt.setUTCMinutes(0, 0, 0);
  // 2025-09-26T14:00:00Z
  return dt.toISOString().substring(0, 13) + ":00:00Z";
}

function dayUtc(d: Date): string /* YYYY-MM-DD */ {
  const dt = new Date(d.getTime());
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diskCachePath(day: string): string {
  return path.join(DISK_CACHE_DIR, `${day}.json`);
}

async function ensureDayCacheLoaded(day: string): Promise<void> {
  if (diskDayCaches.has(day)) return;
  const existing = diskDayLoadPromises.get(day);
  if (existing) return existing;
  const p = (async () => {
    try {
      const pth = diskCachePath(day);
      const data = await fs.readFile(pth, "utf8").catch(() => "{}");
      const obj = JSON.parse(data || "{}") as Record<string, number>;
      const map = new Map<string, number>(Object.entries(obj));
      diskDayCaches.set(day, map);
    } catch {
      diskDayCaches.set(day, new Map());
    }
  })();
  diskDayLoadPromises.set(day, p);
  await p;
}

async function getFromDiskCache(
  day: string,
  key: string
): Promise<number | undefined> {
  await ensureDayCacheLoaded(day);
  const map = diskDayCaches.get(day);
  return map?.get(key);
}

async function putToDiskCache(
  day: string,
  key: string,
  value: number
): Promise<void> {
  await ensureDayCacheLoaded(day);
  const map = diskDayCaches.get(day)!;
  if (!Number.isFinite(value)) return;
  map.set(key, value);
  diskDayDirty.add(day);
}

async function flushDiskCacheDay(day: string): Promise<void> {
  const map = diskDayCaches.get(day);
  if (!map || !diskDayDirty.has(day)) return;
  try {
    await fs.mkdir(DISK_CACHE_DIR, { recursive: true });
    const pth = diskCachePath(day);
    const tmp = pth + ".tmp";
    const obj: Record<string, number> = {};
    for (const [k, v] of map.entries()) obj[k] = v;
    await fs.writeFile(tmp, JSON.stringify(obj), "utf8");
    await fs.rename(tmp, pth);
    diskDayDirty.delete(day);
  } catch {}
}

async function flushAllDiskCache(): Promise<void> {
  const days = Array.from(diskDayDirty.values());
  await Promise.all(days.map((d) => flushDiskCacheDay(d)));
}

function keyFor(q: TemperatureQuery): string {
  const hour = isoHourUtc(q.date);
  // Keep high precision so <1 km different coords are treated as different keys
  const lat = q.lat.toFixed(6);
  const lon = q.lon.toFixed(6);
  return `${lat},${lon}@${hour}`;
}

export async function getOpenMeteoTemperatureC(
  q: TemperatureQuery
): Promise<number> {
  const key = keyFor(q);
  const existing = cache.get(key);
  if (existing) return existing;

  // Try disk cache for the UTC day first
  const day = dayUtc(q.date);
  const diskVal = await getFromDiskCache(day, key);
  if (diskVal !== undefined) {
    const p = Promise.resolve(diskVal);
    cache.set(key, p);
    console.log(`[open-meteo] disk-cache hit for ${key}: ${diskVal}°C`);
    return p;
  }

  const promise = (async () => {
    const hourIso = isoHourUtc(q.date);
    uniqueHours.add(hourIso);
    const startDate = dayUtc(q.date);
    const endDate = startDate; // query only this day for simplicity
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", q.lat.toString());
    url.searchParams.set("longitude", q.lon.toString());
    url.searchParams.set("hourly", "temperature_2m");
    url.searchParams.set("timezone", "UTC");
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date", endDate);

    try {
      // Log the request attempted against Open-Meteo API
      console.log(
        `[open-meteo] fetching hourly temperature: lat=${q.lat.toFixed(6)} lon=${q.lon.toFixed(6)} hour=${hourIso} url=${url.toString()}`
      );
      let res: Response | undefined;
      let attempt = 0;
      while (attempt < 2) {
        fetchCount++;
        res = await fetch(url.toString());
        if (res.ok) break;
        if (res.status === 429) {
          // basic backoff then retry once
          await sleep(2000);
          attempt++;
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res || !res.ok) throw new Error(`HTTP ${res?.status}`);
      const data: any = await res.json();
      const times: string[] = data?.hourly?.time || [];
      const temps: number[] = data?.hourly?.temperature_2m || [];
      let idx = -1;
      if (times && temps && times.length === temps.length) {
        idx = times.findIndex((t) =>
          t.endsWith("Z") ? t === hourIso : `${t}Z` === hourIso
        );
      }
      if (idx >= 0 && Number.isFinite(temps[idx])) {
        console.log(`[open-meteo] got temperature ${temps[idx]}°C for ${key}`);
        await putToDiskCache(day, key, temps[idx]);
        return temps[idx];
      }
      // Fallback: try nearest hour within same day (rare DST issues)
      if (times && times.length) {
        const target = new Date(hourIso).getTime();
        let bestI = 0;
        let bestD = Infinity;
        for (let i = 0; i < times.length; i++) {
          const ti = Date.parse(
            times[i].endsWith("Z") ? times[i] : `${times[i]}Z`
          );
          const d = Math.abs(ti - target);
          if (d < bestD) {
            bestD = d;
            bestI = i;
          }
        }
        const t = temps[bestI];
        console.log(`[open-meteo] using nearest temperature ${t}°C for ${key}`);
        if (Number.isFinite(t)) {
          await putToDiskCache(day, key, t);
          return t;
        }
      }
      throw new Error("No hourly temperature found");
    } catch (e) {
      // Do not use synthetic model anymore; return neutral default
      console.warn(
        `[open-meteo] failed to fetch temperature for ${key}, returning default 10°C: ${(e as Error).message}`
      );
      return 10; // neutral baseline
    }
  })();

  cache.set(key, promise);
  return promise;
}

// Small helper that rounds a Date down to the hour – useful to express the hour used for caching/keying
export function floorToHour(d: Date): Date {
  const t = new Date(d.getTime());
  t.setMinutes(0, 0, 0);
  return t;
}

// -------- Extended hourly bundle (multiple variables) --------
export interface HourlyWeatherSample {
  timeIso: string; // ISO hour UTC
  temperatureC?: number;
  apparentTemperatureC?: number;
  humidityPct?: number;
  precipitationMm?: number;
  rainMm?: number;
  snowfallCm?: number;
  cloudCoverPct?: number;
  windSpeed10mKmh?: number;
  windGusts10mKmh?: number;
  shortwaveRadiationWm2?: number;
  sunshineDurationSec?: number;
  isDay?: boolean; // true if day
}

export interface WeatherHourlyBundle {
  byHour: Map<string, HourlyWeatherSample>; // key is hour ISO (UTC) "YYYY-MM-DDTHH:00:00Z"
}

const bundleMemCache = new Map<string, Promise<WeatherHourlyBundle>>();

function bundleKey(lat: number, lon: number, day: string): string {
  return `${lat.toFixed(6)},${lon.toFixed(6)}@${day}`;
}

export async function getOpenMeteoHourlyBundle(args: {
  date: Date; // any date within the UTC day desired
  lat: number;
  lon: number;
}): Promise<WeatherHourlyBundle> {
  const day = dayUtc(args.date);
  const key = bundleKey(args.lat, args.lon, day);
  const existing = bundleMemCache.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", args.lat.toString());
    url.searchParams.set("longitude", args.lon.toString());
    url.searchParams.set(
      "hourly",
      [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "rain",
        "snowfall",
        "cloudcover",
        "windspeed_10m",
        "windgusts_10m",
        "shortwave_radiation",
        "sunshine_duration",
        "is_day",
      ].join(",")
    );
    url.searchParams.set("timezone", "UTC");
    url.searchParams.set("start_date", day);
    url.searchParams.set("end_date", day);

    let res: Response | undefined;
    let attempt = 0;
    while (attempt < 2) {
      fetchCount++;
      res = await fetch(url.toString());
      if (res.ok) break;
      if (res.status === 429) {
        await sleep(2000);
        attempt++;
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    if (!res || !res.ok) throw new Error(`HTTP ${res?.status}`);
    const data: any = await res.json();
    const times: string[] = data?.hourly?.time || [];
    const out = new Map<string, HourlyWeatherSample>();
    const pick = (arr?: any[], i?: number) =>
      i != null && arr && i >= 0 && i < arr.length ? arr[i] : undefined;
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const raw = t.endsWith("Z") ? t : `${t}Z`;
      const normIso = isoHourUtc(new Date(raw));
      out.set(normIso, {
        timeIso: normIso,
        temperatureC: pick(data?.hourly?.temperature_2m, i),
        apparentTemperatureC: pick(data?.hourly?.apparent_temperature, i),
        humidityPct: pick(data?.hourly?.relative_humidity_2m, i),
        precipitationMm: pick(data?.hourly?.precipitation, i),
        rainMm: pick(data?.hourly?.rain, i),
        snowfallCm: pick(data?.hourly?.snowfall, i),
        cloudCoverPct: pick(data?.hourly?.cloudcover, i),
        windSpeed10mKmh: pick(data?.hourly?.windspeed_10m, i),
        windGusts10mKmh: pick(data?.hourly?.windgusts_10m, i),
        shortwaveRadiationWm2: pick(data?.hourly?.shortwave_radiation, i),
        sunshineDurationSec: pick(data?.hourly?.sunshine_duration, i),
        isDay: pick(data?.hourly?.is_day, i) ? true : false,
      });
    }
    return { byHour: out };
  })();

  bundleMemCache.set(key, promise);
  return promise;
}

export async function getOpenMeteoHourlyBundleRange(args: {
  startDate: Date; // inclusive
  endDate: Date; // inclusive (rounded to day by API)
  lat: number;
  lon: number;
}): Promise<WeatherHourlyBundle> {
  // Normalize to UTC day strings
  const startDay = dayUtc(args.startDate);
  const endDay = dayUtc(args.endDate);
  const key = `range:${args.lat.toFixed(6)},${args.lon.toFixed(6)}@${startDay}..${endDay}`;
  const existing = bundleMemCache.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", args.lat.toString());
    url.searchParams.set("longitude", args.lon.toString());
    url.searchParams.set(
      "hourly",
      [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "rain",
        "snowfall",
        "cloudcover",
        "windspeed_10m",
        "windgusts_10m",
        "shortwave_radiation",
        "sunshine_duration",
        "is_day",
      ].join(",")
    );
    url.searchParams.set("timezone", "UTC");
    url.searchParams.set("start_date", startDay);
    url.searchParams.set("end_date", endDay);

    // Log single-call fetch for observability
    console.log(
      `[open-meteo] fetching hourly bundle range: lat=${args.lat.toFixed(6)} lon=${args.lon.toFixed(6)} days=${startDay}..${endDay} url=${url.toString()}`
    );

    let res: Response | undefined;
    let attempt = 0;
    while (attempt < 2) {
      fetchCount++;
      res = await fetch(url.toString());
      if (res.ok) break;
      if (res.status === 429) {
        await sleep(2000);
        attempt++;
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    if (!res || !res.ok) throw new Error(`HTTP ${res?.status}`);
    const data: any = await res.json();
    const times: string[] = data?.hourly?.time || [];
    const out = new Map<string, HourlyWeatherSample>();
    const pick = (arr?: any[], i?: number) =>
      i != null && arr && i >= 0 && i < arr.length ? arr[i] : undefined;
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      const raw = t.endsWith("Z") ? t : `${t}Z`;
      const normIso = isoHourUtc(new Date(raw));
      out.set(normIso, {
        timeIso: normIso,
        temperatureC: pick(data?.hourly?.temperature_2m, i),
        apparentTemperatureC: pick(data?.hourly?.apparent_temperature, i),
        humidityPct: pick(data?.hourly?.relative_humidity_2m, i),
        precipitationMm: pick(data?.hourly?.precipitation, i),
        rainMm: pick(data?.hourly?.rain, i),
        snowfallCm: pick(data?.hourly?.snowfall, i),
        cloudCoverPct: pick(data?.hourly?.cloudcover, i),
        windSpeed10mKmh: pick(data?.hourly?.windspeed_10m, i),
        windGusts10mKmh: pick(data?.hourly?.windgusts_10m, i),
        shortwaveRadiationWm2: pick(data?.hourly?.shortwave_radiation, i),
        sunshineDurationSec: pick(data?.hourly?.sunshine_duration, i),
        isDay: pick(data?.hourly?.is_day, i) ? true : false,
      });
    }
    console.log(
      `[open-meteo] bundle ready: hours=${out.size} (range ${startDay}..${endDay})`
    );
    return { byHour: out };
  })();

  bundleMemCache.set(key, promise);
  return promise;
}

// Print a compact summary at the end of the process
try {
  const onExit = async () => {
    try {
      await flushAllDiskCache();
      console.log(
        `[open-meteo] summary: totalFetches=${fetchCount} uniqueHours=${uniqueHours.size}`
      );
    } catch {}
  };
  process.on("exit", onExit);
  process.on("beforeExit", onExit as any);
  process.on("SIGINT", async () => {
    await onExit();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await onExit();
    process.exit(0);
  });
} catch {}
