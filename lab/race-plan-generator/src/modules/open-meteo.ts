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

function isoHourUtc(d: Date): string {
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
