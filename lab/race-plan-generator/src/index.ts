#!/usr/bin/env node

import {
  adjustSegmentsByRatios,
  computeOfficialRatios,
} from "./modules/adjust";
import { parseCli } from "./modules/cli";
import { computePlan, formatHms } from "./modules/compute-plan";
import { loadConfig } from "./modules/config";
import { parseGpx } from "./modules/gpx";
import { getEnrichedSegments } from "./modules/segments";
import { splitGpxIntoSegments } from "./modules/splitter";
import { renderElevationProfile } from "./modules/visual";

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
      config.fatigue
    );
    const totalStopDuration = config.stops.reduce(
      (acc, stop) => acc + (stop.duration || 0),
      0
    );
    const totalRunDuration = enrichedSegments.reduce(
      (acc, seg) => acc + (seg.duration || 0),
      0
    );
    const totalDuration = totalRunDuration + totalStopDuration;

    console.log(
      `Total duration (min): ${(totalDuration / 60).toFixed(2)} / in hours ${(totalDuration / 3600).toFixed(2)}`
    );

    const averagePace = totalDuration / 60 / (segmentsLength / 1000); // in min/km
    console.log(`Average pace (min/km): ${averagePace.toFixed(2)}`);
    // Reassign segments to enriched for downstream computePlan to use durations
    segments = enrichedSegments;
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

  const plan = computePlan(segments, originalPoints, config);
  console.log("\nRace plan per leg:");
  for (const leg of plan.legs) {
    const avgPace = leg.movingTimeSec / 60 / (leg.distance / 1000); // in min/km
    console.log(
      `- ${leg.name}: ${(leg.distance / 1000).toFixed(2)} km, +${leg.elevationGain.toFixed(0)} m / -${leg.elevationLoss.toFixed(0)} m, moving ${formatHms(leg.movingTimeSec)} + stop ${formatHms(leg.stopTimeSec)} = ${formatHms(leg.totalTimeSec)} - avg pace ${avgPace.toFixed(2)} min/km`
    );
  }
  console.log(
    `Totals: ${(plan.totals.distance / 1000).toFixed(2)} km, +${plan.totals.elevationGain.toFixed(0)} m / -${plan.totals.elevationLoss.toFixed(0)} m, moving ${formatHms(plan.totals.movingTimeSec)} + stop ${formatHms(plan.totals.stopTimeSec)} = ${formatHms(plan.totals.totalTimeSec)}`
  );
}

main();
