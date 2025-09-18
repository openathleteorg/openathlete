import { promises as fs } from "fs";
import path from "path";

export interface RacePlanConfig {
  raceName: string;
  weightKg: number; // athlete weight in kg
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
