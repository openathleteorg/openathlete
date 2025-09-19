import { promises as fs } from "fs";
import path from "path";

export interface RacePlanConfig {
  raceName: string;
  weightKg: number; // athlete weight in kg
  // ISO 8601 start datetime (with timezone) of the race. Used for time-of-day effects (night)
  startTime?: string;
  // Night underperformance percentage (e.g. 10 means +10% time at night). Default 10.
  nightUnderperfPct?: number;
  goal: {
    type: "time" | "normalized_pace";
    value: number; // in seconds for "time", in min/km for "normalized_pace"
  };
  official?: {
    distanceMeters?: number; // official distance of the course
    elevationGainMeters?: number; // official positive elevation gain
  };
  fatigue?: {
    // Speed modifiers applied linearly from start to finish.
    // Positive = faster, Negative = slower. Example: +5 at start, -5 at finish.
    startSpeedPct?: number; // default 0 (% of speed)
    endSpeedPct?: number; // default 0 (% of speed)
  };
  // Altitude acclimation model controlling altitude penalty on moving times
  altitudeAcclimation?: {
    // Athlete's living/sleep altitude (meters)
    liveAltitudeM?: number; // h_live
    // Recent days spent at altitude in the last 3–4 weeks
    daysAtAltitude?: number; // d_alt
    // Effort intensity factor (≈1.0 5–10k, 0.8 marathon, 0.6 ultra). Default 0.6
    intensityFactor?: number; // intensity
    // Base penalty per 1000 m as fraction (default 0.07 = 7%)
    basePenaltyPerKmAlt?: number; // p0
  };
  stops: {
    name: string;
    coords: { lat: number; lon: number };
    duration: number; // in seconds
  }[];
}

export async function loadConfig(filePath: string): Promise<RacePlanConfig> {
  const base = process.env.INIT_CWD || process.cwd();
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(base, filePath);
  const raw = await fs.readFile(resolved, "utf8");
  try {
    const json = JSON.parse(raw);
    return json as RacePlanConfig;
  } catch (e: any) {
    throw new Error(
      `Failed to parse config JSON at ${resolved}: ${e?.message || e}`
    );
  }
}
