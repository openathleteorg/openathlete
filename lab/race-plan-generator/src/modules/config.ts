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

  // Nutrition & hydration configuration
  nutrition?: {
    // Size of a soft flask in milliliters (default 500 ml)
    flaskSizeMl?: number;
    // If true, carbs dissolved in drink count toward carb target
    enableCarbsInFlasks?: boolean;
    // Carbs concentration in grams per litre of water (e.g., 60 g/L)
    carbsPerLitre?: number;
    hydration?: {
      // Base sweat rate in L/h at moderate effort
      sweatRateBaseLPerH?: number; // default 0.6
      // Multiplier applied with effort in 0..1 (effective: base*(1+effortFactor*effort))
      effortFactor?: number; // default 0.6
      // Allow underfilling up to this amount per leg (ml) to reduce flask count
      underfillToleranceMl?: number; // default 0
    };
    // Catalog of available nutrition items
    items?: NutritionItem[];
  };
}

export type NutritionForm = "liquid" | "gel" | "puree" | "solid";

export interface NutritionItem {
  id: string; // unique identifier
  label: string; // display name
  carbsPerUnit: number; // grams of carbs per unit (gel, bar, pouch)
  unitLabel?: string; // e.g., "gel", "pâte", "pouch"
  form: NutritionForm; // texture/form
  hardness?: number; // 0=liquid, 1=hard solid (optional finer scale)
  volumePerUnitMl?: number; // if liquid, volume per unit
  caffeineMg?: number;
  sodiumMg?: number;
  energyKcal?: number;
  digestibility?: number; // 0..1 subjective ease
  preferredContexts?: string[]; // e.g., ["climb","descent","night"]
  minIntervalMin?: number; // recommended min time between same item
  maxConsecutive?: number; // avoid too many in a row
  notes?: string;
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
