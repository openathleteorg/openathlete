import { RacePlanConfig } from "./config";
import { GpxEnrichedSegment } from "./segments";
import { averageAltitudeM, stravaPolynomial } from "./utils";
import { createTemperatureModel } from "./temperature";

const CR_FLAT_KCAL = 1.0; // kcal per kg per km
const INTENSITY_FACTOR = 0.55; // average intensity factor for ultras

// Parameters for CHO fraction model
const CHO_A = 1.3; // slope for intensity-base
const CHO_B = -0.25; // intercept
const CHO_MIN = 0.1; // 10%
const CHO_MAX = 0.95; // 95%
const KT = 0.05; // temperature correction coefficient
const KALT = 0.04; // altitude correction coefficient
const KPROG = 0.06; // progression (glycogen decline) coefficient

function clip(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function computeChoFraction(params: {
  intensity: number; // 0..1 fraction of VO2max proxy
  temperatureC: number;
  altitudeM: number;
  progress01: number; // 0=start .. 1=end (by distance)
}): number {
  const { intensity, temperatureC, altitudeM, progress01 } = params;
  // Base from intensity
  const fBase = clip(CHO_A * intensity + CHO_B, CHO_MIN, CHO_MAX);
  // Corrections
  const dT = KT * ((temperatureC - 10) / 10);
  const dAlt = KALT * (altitudeM / 1000);
  // const dProg = -KPROG * clip(progress01, 0, 1);
  const dProg = 0;
  // Total fraction
  return clip(fBase + dT + dAlt + dProg, CHO_MIN, CHO_MAX);
}

function computeSegmentCalories(
  segment: GpxEnrichedSegment,
  weightKg: number
): number {
  const grade = segment.averageGrade; // in %
  const gradeFactor = stravaPolynomial(grade);

  return CR_FLAT_KCAL * weightKg * (segment.length / 1000) * gradeFactor;
}

function computeCarbsFromCalories(
  calories: number,
  choFraction: number
): number {
  return (calories * choFraction) / 4;
}

export interface NutritionSegment {
  index: number;
  distanceKm: number;
  cumulativeKmCenter: number; // progression reference at segment center
  elevationGain: number;
  elevationLoss: number;
  avgGradePct: number;
  avgAltitudeM: number;
  midLat: number;
  midLon: number;
  durationSec: number;
  kcal: number;
  choFraction: number; // 0..1
  choGrams: number;
}

export interface NutritionPlanResult {
  segments: NutritionSegment[];
  totals: {
    distanceKm: number;
    kcal: number;
    choGrams: number;
  };
}

export function computeNutritionPlan(
  segments: GpxEnrichedSegment[],
  config: RacePlanConfig
): NutritionPlanResult {
  const weightKg = config.weightKg;
  const startIso = config.startTime;
  const startDate = startIso ? new Date(startIso) : new Date(0);
  const tempAt = createTemperatureModel();
  const totalDistance = segments.reduce((sum, seg) => sum + seg.length, 0) || 1;

  // Precompute cumulative distances to segment centers and absolute time
  let cumDist = 0;
  let cumTimeSec = 0;
  let totalCalories = 0;
  let totalCho = 0;
  const out: NutritionSegment[] = [];

  segments.forEach((seg, idx) => {
    const segKm = (seg.length || 0) / 1000;
    const centerCumKm = (cumDist + seg.length / 2) / 1000;
    const progress01 = (cumDist + seg.length / 2) / totalDistance;
    const altitudeM = averageAltitudeM(seg);

    const kcal = computeSegmentCalories(seg, weightKg);
    const choFraction = computeChoFraction({
      intensity: INTENSITY_FACTOR,
      temperatureC: tempAt({
        date: new Date(
          startDate.getTime() + (cumTimeSec + (seg.duration || 0) / 2) * 1000
        ),
        lat: seg.points[Math.floor(seg.points.length / 2)]?.lat ?? 0,
        lon: seg.points[Math.floor(seg.points.length / 2)]?.lon ?? 0,
        altitudeM: altitudeM,
      }),
      altitudeM,
      progress01,
    });
    const choGrams = computeCarbsFromCalories(kcal, choFraction);

    totalCalories += kcal;
    totalCho += choGrams;

    const midIdx = Math.floor(seg.points.length / 2);
    const mid =
      seg.points[Math.max(0, Math.min(seg.points.length - 1, midIdx))];
    out.push({
      index: idx,
      distanceKm: segKm,
      cumulativeKmCenter: centerCumKm,
      elevationGain: seg.elevationGain,
      elevationLoss: seg.elevationLoss,
      avgGradePct: seg.averageGrade,
      avgAltitudeM: altitudeM,
      midLat: mid?.lat ?? 0,
      midLon: mid?.lon ?? 0,
      durationSec: seg.duration,
      kcal,
      choFraction,
      choGrams,
    });

    cumDist += seg.length;
    cumTimeSec += seg.duration || 0;
  });

  return {
    segments: out,
    totals: {
      distanceKm: totalDistance / 1000,
      kcal: totalCalories,
      choGrams: totalCho,
    },
  };
}
