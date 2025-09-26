// Shared types for race plan visualization export (lab -> web UI)
// Versioned to allow future evolution without breaking older exports.

export interface RacePlanVisualizationExportV1Meta {
  version: 1;
  generatedAt: string; // ISO date string
  raceName?: string;
  source?: {
    gpxFileName?: string;
    configFileName?: string;
  };
  configSnapshot?: any; // Optional raw snapshot of config used (kept loose to avoid tight coupling)
}

export interface RacePlanPoint {
  lat: number;
  lon: number;
  ele?: number; // meters
  distanceFromStartM: number;
  cumulativeElevationGainM?: number;
  timeFromStartSec?: number; // optional if computed
}

export interface RacePlanSegmentNutrition {
  kcal: number;
  choFraction: number; // 0..1
  choGrams: number;
}

export interface RacePlanSegment {
  index: number;
  startPointIndex: number;
  endPointIndex: number;
  lengthM: number;
  elevationGainM: number;
  elevationLossM: number;
  averageGradePct: number;
  avgAltitudeM?: number;
  durationSec: number;
  movingPaceSecPerKm?: number;
  temperatureC?: number;
  altitudeSlowdownMultiplier?: number;
  nightSlowdownMultiplier?: number;
  temperatureSlowdownMultiplier?: number;
  startDistanceKm: number;
  endDistanceKm: number;
  startTimeSec?: number;
  endTimeSec?: number;
  nutrition: RacePlanSegmentNutrition;
}

export interface RacePlanSlopeGroup {
  id: string;
  type: string; // 'big_climb' | 'big_descent' | 'climb' | 'descent' | 'flat'
  startPointIndex: number;
  endPointIndex: number;
  distanceM: number;
  elevationGainM?: number;
  elevationLossM?: number;
  averageGradePct: number;
  durationSec: number;
  averagePaceSecPerKm?: number;
}

export interface RacePlanLeg {
  index: number;
  name: string;
  distanceM: number;
  elevationGainM: number;
  elevationLossM: number;
  movingTimeSec: number;
  stopTimeSec: number;
  totalTimeSec: number;
  averageTemperatureC?: number;
  startDistanceKm: number;
  endDistanceKm: number;
  startTimeSec?: number;
  endTimeSec?: number;
  associatedStopIndex?: number; // if leg ends at stop
}

export interface RacePlanStop {
  index: number;
  name: string;
  lat: number;
  lon: number;
  plannedStopDurationSec?: number;
  cumulativeDistanceKm: number;
  arrivalTimeSec?: number;
}

export interface RacePlanLegNutritionFood {
  label: string;
  carbsG: number; // total carbs for the units
  units: number;
  carbsPerUnitG: number;
}

export interface RacePlanLegNutritionDetail {
  legIndex: number;
  legName: string;
  carbsTargetG: number;
  carbsViaFlasksG: number;
  carbsViaFoodsG: number;
  hydrationLitres: number;
  carryLitres: number;
  flasksCount: number;
  pickupAtStart: {
    flasksToFill: number;
    fillVolumeMl: number;
  };
  selectedFoods: RacePlanLegNutritionFood[];
}

export interface RacePlanNutritionTotals {
  carbsTargetG: number;
  carbsViaFlasksG: number;
  carbsViaFoodsG: number;
  hydrationLitres: number;
}

export interface RacePlanNutritionSegmentsEntry {
  index: number;
  cumulativeKmCenter: number;
  distanceKm: number;
  durationSec: number;
  kcal: number;
  choFraction: number;
  choGrams: number;
  avgAltitudeM: number;
  avgGradePct: number;
  elevationGain: number;
  elevationLoss: number;
  midLat: number;
  midLon: number;
}

export interface RacePlanDerivedTotals {
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  totalDurationSec: number;
  movingTimeSec: number;
  stopTimeSec: number;
  averageCarbsPerHour?: number;
  altitude?: { min: number; max: number };
  temperature?: { min: number; max: number };
}

export interface RacePlanVisualizationExportV1 {
  meta: RacePlanVisualizationExportV1Meta;
  points: RacePlanPoint[];
  segments: RacePlanSegment[];
  slopeGroups: RacePlanSlopeGroup[];
  legs: RacePlanLeg[];
  stops: RacePlanStop[];
  nutrition: {
    perLeg: RacePlanLegNutritionDetail[];
    totals: RacePlanNutritionTotals;
    segments: RacePlanNutritionSegmentsEntry[];
  };
  derived: RacePlanDerivedTotals;
  uiHints?: {
    recommendedColorScale?: {
      temperature?: string;
      carbs?: string;
    };
  };
}

export type RacePlanVisualizationExport = RacePlanVisualizationExportV1;