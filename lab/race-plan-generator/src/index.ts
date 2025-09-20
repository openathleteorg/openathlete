#!/usr/bin/env node

import {
  adjustSegmentsByRatios,
  computeOfficialRatios,
} from "./modules/adjust";
import { parseCli } from "./modules/cli";
import { computeNutritionPlan } from "./modules/compute-nutrition-plan";
import { computePlan } from "./modules/compute-plan";
import { loadConfig } from "./modules/config";
import { parseGpx } from "./modules/gpx";
import { applyNightUnderperformance } from "./modules/night";
import { getEnrichedSegments } from "./modules/segments";
import { groupSlopeSegments } from "./modules/slope-segmentation";
import { splitGpxIntoSegments } from "./modules/splitter";
import { formatHms, formatMPerKm } from "./modules/utils";
import {
  renderElevationProfile,
  renderElevationWithSegmentation,
  renderSegmentMetrics,
} from "./modules/visual";

async function main(): Promise<void> {
  const args = parseCli(process.argv.slice(2));
  const config = await loadConfig(args.config);
  const gpx = await parseGpx(args.gpx);
  const originalPoints = gpx.tracks[0]?.points || [];
  let segments = splitGpxIntoSegments(
    originalPoints,
    (config.stops || []).map((s) => ({ lat: s.coords.lat, lon: s.coords.lon }))
  );
  if (config.official) {
    const { distanceRatio, gainRatio, currentDistance, currentGain } =
      computeOfficialRatios(segments, config.official);
    if (distanceRatio !== 1 || gainRatio !== 1) {
      console.log(
        `Applying official ratios: distance x${distanceRatio.toFixed(4)} (cur ${(currentDistance / 1000).toFixed(2)} km) / gain x${gainRatio.toFixed(4)} (cur ${currentGain.toFixed(0)} m)`
      );
      segments = adjustSegmentsByRatios(segments, distanceRatio, gainRatio);
    }
  }
  const segmentsGain = segments.reduce(
    (acc, seg) => acc + seg.elevationGain,
    0
  );
  const segmentsLength = segments.reduce((acc, seg) => acc + seg.length, 0);
  console.log(`Total distance (km): ${(segmentsLength / 1000).toFixed(2)}`);
  console.log(`Total elevation gain (m): ${segmentsGain.toFixed(1)}`);
  console.log(`(segments sum: ${segmentsGain.toFixed(1)})`);

  if (config.goal.type === "normalized_pace") {
    const enrichedSegments = getEnrichedSegments(
      segments,
      config.goal.value,
      config.fatigue,
      config.altitudeAcclimation
    );
    const totalStopDuration = config.stops.reduce(
      (acc, stop) => acc + (stop.duration || 0),
      0
    );

    if (config.altitudeAcclimation) {
      const totalMove =
        enrichedSegments.reduce((a, s) => a + (s.duration || 0), 0) || 1;
      const weightedAvgMult =
        enrichedSegments.reduce(
          (a, s) => a + (s.altitudeSlowdownMultiplier ?? 1) * (s.duration || 0),
          0
        ) / totalMove;
      const maxMult = Math.max(
        ...enrichedSegments.map((s) => s.altitudeSlowdownMultiplier ?? 1)
      );
      const avgPct = (weightedAvgMult - 1) * 100;
      const maxPct = (maxMult - 1) * 100;
      if (avgPct > 0.05) {
        console.log(
          `Altitude impact (with acclimation): avg +${avgPct.toFixed(1)}% time, max +${maxPct.toFixed(1)}% on highest segments`
        );
      }
    }
    // Reassign segments to enriched for downstream computePlan to use durations

    // Apply night underperformance based on start time and stops
    const enrichedWithNight = applyNightUnderperformance(
      enrichedSegments,
      originalPoints,
      config
    );

    const totalRunDuration = enrichedWithNight.reduce(
      (acc, seg) => acc + (seg.duration || 0),
      0
    );
    const totalDuration = totalRunDuration + totalStopDuration;

    console.log(
      `Total duration (min): ${(totalDuration / 60).toFixed(2)} / in hours ${(totalDuration / 3600).toFixed(2)}`
    );

    const averagePace = totalDuration / 60 / (segmentsLength / 1000); // in min/km
    console.log(
      `Average pace (min/km): ${averagePace.toFixed(2)}, while moving ${(totalRunDuration / 60 / (segmentsLength / 1000)).toFixed(2)}`
    );

    const plan = computePlan(enrichedWithNight, originalPoints, config);
    await renderSegmentMetrics(enrichedWithNight, {
      outDir: "dist",
      width: 1000,
      height: 360,
    });
    // Compute slope-based segmentation similar to Suunto Climb Pro
    const groups = groupSlopeSegments(enrichedWithNight, {});
    // Render elevation with colored segmentation overlay
    await renderElevationWithSegmentation(originalPoints, groups, {
      name: (config.raceName || "Elevation") + " + segmentation",
      outDir: "dist",
      width: 1200,
      height: 420,
    });
    const nutritionPlan = computeNutritionPlan(enrichedWithNight, config);
    console.log("\nRace plan per leg:");

    let cumulativeKm = 0;
    let cumulativeTimeSec = 0;
    for (const leg of plan.legs) {
      cumulativeKm += leg.distance / 1000;
      cumulativeTimeSec += leg.totalTimeSec;
      const avgPace = leg.movingTimeSec / 60 / (leg.distance / 1000); // in min/km
      console.log(
        `- ${leg.name}: ${(leg.distance / 1000).toFixed(2)} km, +${leg.elevationGain.toFixed(0)} m / -${leg.elevationLoss.toFixed(0)} m, moving ${formatHms(leg.movingTimeSec)} + stop ${formatHms(leg.stopTimeSec)} = ${formatHms(leg.totalTimeSec)} - avg pace ${formatMPerKm(avgPace)} min/km | cumulative: ${cumulativeKm.toFixed(2)} km, ${formatHms(cumulativeTimeSec)}`
      );
    }
    console.log(
      `Totals: ${(plan.totals.distance / 1000).toFixed(2)} km, +${plan.totals.elevationGain.toFixed(0)} m / -${plan.totals.elevationLoss.toFixed(0)} m, moving ${formatHms(plan.totals.movingTimeSec)} + stop ${formatHms(plan.totals.stopTimeSec)} = ${formatHms(plan.totals.totalTimeSec)}`
    );

    console.log("\nNutrition plan per leg:");
    let nutCumulativeKm = 0;
    let nutCumulativeCho = 0;
    for (let i = 0; i < plan.legs.length; i++) {
      const leg = plan.legs[i];
      const nutSegments = nutritionPlan.segments.filter(
        (s) =>
          s.cumulativeKmCenter >= (nutCumulativeKm || 0) && // start at previous cumulative
          s.cumulativeKmCenter <= nutCumulativeKm + leg.distance / 1000 // end at current cumulative
      );
      const legCho = nutSegments.reduce((acc, s) => acc + s.choGrams, 0);
      nutCumulativeKm += leg.distance / 1000;
      nutCumulativeCho += legCho;
      console.log(
        `- ${leg.name}: ${(leg.distance / 1000).toFixed(2)} km, +${leg.elevationGain.toFixed(0)} m / -${leg.elevationLoss.toFixed(0)} m -> ${legCho.toFixed(0)} g CHO for time: ${formatHms(leg.totalTimeSec)} (${(legCho / (leg.totalTimeSec / 3600)).toFixed(0)} g/h)`
      );
    }
    console.log(
      `Totals: ${nutritionPlan.totals.distanceKm.toFixed(2)} km -> ${nutritionPlan.totals.choGrams.toFixed(0)} g CHO`
    );
    console.log(
      `Average cars/hour: ${(nutritionPlan.totals.choGrams / (totalDuration / 3600)).toFixed(0)} g/h over ${formatHms(totalDuration)}`
    );

    const flatSegments = segments.filter(
      (s) => s.averageGrade >= -1 && s.averageGrade <= 1
    );
    console.log(
      `Flat segments (<=1%): ${flatSegments.length} / ${segments.length} (${((flatSegments.length / segments.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `Total flat distance (km): ${(flatSegments.reduce((a, s) => a + s.length, 0) / 1000).toFixed(2)} km`
    );

    // Print big climbs/descents summary with metrics
    const bigClimbs = groups.filter((g) => g.type === "big_climb");
    const bigDescents = groups.filter((g) => g.type === "big_descent");
    if (bigClimbs.length || bigDescents.length) {
      console.log("\nMajor climbs/descents:");
      for (const [i, g] of bigClimbs.entries()) {
        console.log(
          `Climb #${i + 1}: ${(g.distance / 1000).toFixed(2)} km, +${g.elevationGain.toFixed(0)} m, avg grade ${g.averageGrade.toFixed(1)}%, time ${formatHms(g.duration)}, pace ${formatMPerKm(g.averagePace)} min/km`
        );
      }
      for (const [i, g] of bigDescents.entries()) {
        console.log(
          `Descent #${i + 1}: ${(g.distance / 1000).toFixed(2)} km, -${g.elevationLoss.toFixed(0)} m, avg grade ${g.averageGrade.toFixed(1)}%, time ${formatHms(g.duration)}, pace ${formatMPerKm(g.averagePace)} min/km`
        );
      }
    }
  }

  const firstTrack = gpx.tracks[0];
  if (firstTrack && firstTrack.points.length) {
    await renderElevationProfile(originalPoints, {
      name: config.raceName || "Elevation profile",
      outDir: "dist",
      width: 1000,
      height: 420,
    });
  }
}

main();
