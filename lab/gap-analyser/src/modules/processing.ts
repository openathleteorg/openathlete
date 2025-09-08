import { TrackPoint } from "./gpx";

export interface GAPWindow {
  activityId: string; // filename
  startTime: Date;
  endTime: Date;
  durationSec: number;
  avgSpeedMs: number | null;
  avgHr: number | null;
  avgGradientPct: number | null;
  efficiency: number | null; // hr / speed
  normalizedEfficiency?: number | null;
  isValid: boolean;
}

export interface ActivityBaselineResult {
  baselineEfficiency: number; // median on near flat
  windowsConsidered: number;
  trimmed: boolean;
}

const WINDOW_SECONDS = 60;
const MAX_SPEED_MS = 7.5; // ~4:00 min/km pace threshold to exclude sprints? adjust
const MIN_SPEED_MS = 1.2; // walking lower bound
const MAX_GRADIENT_ABS = 40; // sanity cap

function computeDistanceMeters(a: TrackPoint, b: TrackPoint): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function gradientBetween(
  a: TrackPoint,
  b: TrackPoint,
  dist: number
): number | null {
  if (a.ele == null || b.ele == null) return null;
  if (dist < 1) return null;
  return ((b.ele - a.ele) / dist) * 100;
}

export function buildWindowsForActivity(
  points: TrackPoint[],
  activityId: string
): GAPWindow[] {
  if (!points.length) return [];
  const windows: GAPWindow[] = [];
  let idx = 0;
  while (idx < points.length) {
    const start = points[idx];
    const startTime = start.time!;
    const windowEnd = new Date(startTime.getTime() + WINDOW_SECONDS * 1000);
    let j = idx + 1;
    let dist = 0;
    let hrVals: number[] = [];
    let elevStart = start;
    let elevEnd = start;
    const windowPts: TrackPoint[] = [start];
    while (j < points.length && points[j].time! < windowEnd) {
      const d = computeDistanceMeters(points[j - 1], points[j]);
      dist += d;
      windowPts.push(points[j]);
      if (points[j].hr != null) hrVals.push(points[j].hr as number);
      elevEnd = points[j];
      j++;
    }
    const end = windowPts[windowPts.length - 1];
    const durationSec = (end.time!.getTime() - startTime.getTime()) / 1000;
    const speed = durationSec > 0 ? dist / durationSec : null;
    const avgHr = hrVals.length ? median(hrVals) : null;
    const gradRaw = gradientBetween(elevStart, elevEnd, dist);
    const avgGradientPct =
      gradRaw != null
        ? clamp(gradRaw, -MAX_GRADIENT_ABS, MAX_GRADIENT_ABS)
        : null;
    const efficiency = speed && speed > 0 && avgHr ? avgHr / speed : null;

    const speedOk =
      speed != null && speed >= MIN_SPEED_MS && speed <= MAX_SPEED_MS;
    const hrOk = avgHr != null && avgHr >= 60 && avgHr <= 200;
    const gradOk = avgGradientPct != null; // allow wide range but not null

    // variance checks (HR & elevation) simple: remove if HR spread too big
    const hrVarianceOk = hrVals.length < 2 || stddev(hrVals) <= 8; // arbitrary stability threshold

    const isValid =
      durationSec >= WINDOW_SECONDS * 0.8 &&
      speedOk &&
      hrOk &&
      gradOk &&
      hrVarianceOk;

    windows.push({
      activityId,
      startTime,
      endTime: end.time!,
      durationSec,
      avgSpeedMs: speed,
      avgHr,
      avgGradientPct,
      efficiency,
      isValid,
    });

    // move index: slide window by 60s (non overlapping) for simplicity
    while (idx < points.length && points[idx].time! < windowEnd) idx++;
  }
  return windows;
}

export function computeActivityBaseline(
  windows: GAPWindow[]
): ActivityBaselineResult {
  const nearFlat = windows.filter(
    (w) =>
      w.isValid &&
      w.avgGradientPct != null &&
      Math.abs(w.avgGradientPct) <= 0.5 &&
      w.efficiency != null
  );
  let efficiencies = nearFlat
    .map((w) => w.efficiency!)
    .filter((v) => isFinite(v) && v > 0);

  let trimmed = false;
  if (efficiencies.length >= 10) {
    // remove extreme 10% tails for stability
    const sorted = efficiencies.slice().sort((a, b) => a - b);
    const cut = Math.floor(sorted.length * 0.1);
    efficiencies = sorted.slice(cut, sorted.length - cut || sorted.length);
    trimmed = true;
  }
  const baseline = efficiencies.length ? median(efficiencies) : 1;
  return {
    baselineEfficiency: baseline,
    windowsConsidered: efficiencies.length,
    trimmed,
  };
}

export function normalizeEfficiencyForActivity(
  windows: GAPWindow[],
  baseline: ActivityBaselineResult
): GAPWindow[] {
  return windows.map((w) => {
    if (!w.isValid || w.efficiency == null)
      return { ...w, normalizedEfficiency: null };
    return {
      ...w,
      normalizedEfficiency: w.efficiency / baseline.baselineEfficiency,
    };
  });
}

function median(arr: number[]): number {
  if (!arr.length) return NaN;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance =
    arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
