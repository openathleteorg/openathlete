import { GpxSegment } from "./splitter";
import { averageAltitudeM, stravaPolynomial } from "./utils";
import { RacePlanConfig } from "./config";

export interface GpxEnrichedSegment extends GpxSegment {
  duration: number; // in seconds
  averagePace: number; // in min/km
  altitudeSlowdownMultiplier?: number; // multiplier (>1 means slower) applied due to altitude
  altitudeAvgM?: number; // average altitude used for computation
  speedMultiplier?: number; // fatigue speed multiplier applied (for debugging)
  nightMultiplier?: number; // multiplier (>1 means slower) applied during night
}

export function getEnrichedSegments(
  segments: GpxSegment[],
  normalizedPace: number,
  fatigue?: { startSpeedPct?: number; endSpeedPct?: number },
  altitudeAcclimation?: RacePlanConfig["altitudeAcclimation"]
) {
  // First pass: compute base durations without fatigue (grade effect only)
  const baseDurations = segments.map((seg) => {
    const paceFactor = stravaPolynomial(seg.averageGrade);
    const adjustedPace = normalizedPace * paceFactor; // min/km
    return (seg.length / 1000) * adjustedPace * 60; // seconds
  });
  const totalBaseTime = baseDurations.reduce((s, t) => s + t, 0) || 1;

  const startPct = (fatigue?.startSpeedPct ?? 0) / 100;
  const endPct = (fatigue?.endSpeedPct ?? 0) / 100;

  let accBase = 0;
  const enriched = segments.map((seg, i) => {
    const baseDuration = baseDurations[i];
    const centerTime = accBase + baseDuration / 2;
    const progress = Math.min(1, Math.max(0, centerTime / totalBaseTime));
    const speedMultiplier = 1 + startPct + (endPct - startPct) * progress;

    // Altitude impact with acclimation model
    let altitudeMultiplier = 1;
    let avgAlt = 0;
    if (altitudeAcclimation) {
      avgAlt = averageAltitudeM(seg);
      const p0 = altitudeAcclimation.basePenaltyPerKmAlt ?? 0.07; // 7% per 1000 m
      const intensity = altitudeAcclimation.intensityFactor ?? 0.6; // default ultra
      const hLive = altitudeAcclimation.liveAltitudeM ?? 0;
      const dAlt = Math.max(0, altitudeAcclimation.daysAtAltitude ?? 0);

      const r_days = 0.5 * (1 - Math.exp(-dAlt / 10));
      const r_live = 0.3 * Math.min(1, hLive / Math.max(avgAlt, 1));
      const r = Math.min(0.7, r_days + r_live);

      const penaltyPer1000 = p0 * intensity * (1 - r);
      altitudeMultiplier = 1 + penaltyPer1000 * (avgAlt / 1000);
      if (!Number.isFinite(altitudeMultiplier) || altitudeMultiplier < 1) {
        altitudeMultiplier = 1;
      }
    }

    const duration =
      (baseDuration / (speedMultiplier || 1)) * altitudeMultiplier;
    const avgPaceMinPerKm = duration / 60 / (seg.length / 1000 || 1);

    accBase += baseDuration;
    return {
      ...seg,
      duration,
      averagePace: avgPaceMinPerKm,
      altitudeSlowdownMultiplier:
        altitudeMultiplier > 1 ? altitudeMultiplier : undefined,
      altitudeAvgM: avgAlt || undefined,
      speedMultiplier: speedMultiplier !== 1 ? speedMultiplier : undefined,
    };
  });

  return enriched;
}
