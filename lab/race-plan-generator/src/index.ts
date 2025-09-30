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
import { planNutritionPerLeg } from "./modules/nutrition-planner";
import type { FullNutritionPlanPerLeg } from "./modules/nutrition-planner";
import { promises as fs } from "fs";
import path from "path";
import { applyTemperatureSlowdown } from "./modules/temperature-slowdown";
import { sampleWeatherEveryKm } from "./modules/weather";
import {
  renderElevationProfile,
  renderElevationWithSegmentation,
  renderSegmentMetrics,
  renderTemperatureChart,
} from "./modules/visual";
import { RacePlanVisualizationExportV1 } from "@openathlete/shared";

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

  let exportObj: RacePlanVisualizationExportV1 | undefined;

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
    // Apply night & temperature slowdowns
    const enrichedWithNight = applyNightUnderperformance(
      enrichedSegments,
      originalPoints,
      config
    );
    // Precompute Open‑Meteo samples once at 1 km resolution to reuse everywhere
    const startDate = new Date(config.startTime as string);
    const kmWeather = await sampleWeatherEveryKm(
      originalPoints,
      enrichedWithNight,
      startDate
    );
    // Reuse single-call weather samples as temperature inputs for subsequent steps
    const kmSamples = kmWeather.map((w) => ({
      distM: w.distM,
      timeSec: w.timeSec,
      lat: w.lat,
      lon: w.lon,
      tempC: w.tempC,
    }));

    const enrichedWithTemp = await applyTemperatureSlowdown(
      enrichedWithNight,
      originalPoints,
      config,
      kmSamples
    );

    const finalSegments = enrichedWithTemp;

    const totalRunDuration = finalSegments.reduce(
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

    const plan = computePlan(finalSegments, originalPoints, config);
    await renderSegmentMetrics(finalSegments, {
      outDir: "dist",
      width: 1000,
      height: 360,
    });
    // Slope-based segmentation (climbs/descentes)
    const groups = groupSlopeSegments(finalSegments, {});
    await renderElevationWithSegmentation(originalPoints, groups, {
      name: (config.raceName || "Elevation") + " + segmentation",
      outDir: "dist",
      width: 1200,
      height: 420,
    });
    await renderTemperatureChart(finalSegments, config, {
      name: (config.raceName || "Course") + " · Température",
      outDir: "dist",
      width: 1200,
      height: 420,
      kmSamples,
    });
    const nutritionPlan = await computeNutritionPlan(
      finalSegments,
      config,
      kmSamples
    );

    const perLeg = await planNutritionPerLeg({
      plan,
      nutritionSegments: nutritionPlan,
      config,
      kmSamples,
    });

    // Build export object if requested
    if (args.json) {
      // Reconstruct points array with cumulative distance/time
      let cumDist = 0;
      let cumGain = 0;
      let cumTime = 0;
      const pointsExport = originalPoints.map((p, i) => {
        if (i > 0) {
          const prev = originalPoints[i - 1];
          const d = Math.sqrt(
            (p.lat - prev.lat) * (p.lat - prev.lat) +
              (p.lon - prev.lon) * (p.lon - prev.lon)
          ); // rough; precise not needed for cumulative again (already in segments)
          cumDist += d; // note: approximate; we will override with segment boundaries for distanceFromStartM where needed
          const elevDelta = (p.ele || 0) - (prev.ele || 0);
          if (elevDelta > 0) cumGain += elevDelta;
        }
        return {
          lat: p.lat,
          lon: p.lon,
          ele: p.ele || undefined,
          distanceFromStartM: 0, // patch later
          cumulativeElevationGainM: cumGain,
          timeFromStartSec: undefined,
        };
      });
      // Use segment cumulative distances for accuracy
      let segCumDist = 0;
      for (const seg of finalSegments) {
        const startPt = seg.points[0];
        const endPt = seg.points[seg.points.length - 1];
        const startIdx = originalPoints.indexOf(startPt);
        const endIdx = originalPoints.indexOf(endPt);
        if (startIdx >= 0) {
          pointsExport[startIdx].distanceFromStartM = segCumDist;
        }
        segCumDist += seg.length;
        if (endIdx >= 0) {
          pointsExport[endIdx].distanceFromStartM = segCumDist;
        }
      }
      // Interpolate missing distanceFromStartM if zeros remain
      let lastKnown = 0;
      for (let i = 0; i < pointsExport.length; i++) {
        if (pointsExport[i].distanceFromStartM === 0 && i !== 0) {
          pointsExport[i].distanceFromStartM = lastKnown;
        } else {
          lastKnown = pointsExport[i].distanceFromStartM;
        }
      }

      // Map segments for export
      let cumulativeTime = 0;
      // Build quick lookup of nutrition per segment center distance to annotate segments
      const nutritionBySegmentIndex = new Map<
        number,
        { kcal: number; choFraction: number; choGrams: number }
      >();
      // We approximate mapping by choosing nutrition segment whose center falls inside segment distance span
      for (const n of nutritionPlan.segments) {
        nutritionBySegmentIndex.set(n.index, {
          kcal: n.kcal,
          choFraction: n.choFraction,
          choGrams: n.choGrams,
        });
      }

      const segmentsExport = finalSegments.map((s, idx) => {
        const startPoint = s.points[0];
        const endPoint = s.points[s.points.length - 1];
        const startIdx = originalPoints.indexOf(startPoint);
        const endIdx = originalPoints.indexOf(endPoint);
        const startDistanceKm =
          pointsExport[startIdx]?.distanceFromStartM / 1000 || 0;
        const endDistanceKm =
          pointsExport[endIdx]?.distanceFromStartM / 1000 || startDistanceKm;
        const durationSec = s.duration || 0;
        const nut = nutritionBySegmentIndex.get(idx) || {
          kcal: 0,
          choFraction: 0,
          choGrams: 0,
        };
        const segObj = {
          index: idx,
          startPointIndex: startIdx,
          endPointIndex: endIdx,
          lengthM: s.length,
          elevationGainM: s.elevationGain,
          elevationLossM: s.elevationLoss,
          averageGradePct: s.averageGrade,
          avgAltitudeM:
            s.points.reduce((a, p) => a + (p.ele || 0), 0) / s.points.length ||
            0,
          durationSec,
          movingPaceSecPerKm: durationSec / (s.length / 1000),
          temperatureC: s.temperatureC,
          altitudeSlowdownMultiplier: s.altitudeSlowdownMultiplier,
          nightSlowdownMultiplier: (s as any).nightMultiplier,
          temperatureSlowdownMultiplier: s.temperatureMultiplier,
          startDistanceKm,
          endDistanceKm,
          startTimeSec: cumulativeTime,
          endTimeSec: cumulativeTime + durationSec,
          nutrition: {
            kcal: nut.kcal,
            choFraction: nut.choFraction,
            choGrams: nut.choGrams,
          },
        };
        cumulativeTime += durationSec;
        return segObj;
      });

      const nutritionSegmentsExport = nutritionPlan.segments.map((n) => ({
        index: n.index,
        cumulativeKmCenter: n.cumulativeKmCenter,
        distanceKm: n.distanceKm,
        durationSec: n.durationSec,
        kcal: n.kcal,
        choFraction: n.choFraction,
        choGrams: n.choGrams,
        avgAltitudeM: n.avgAltitudeM,
        avgGradePct: n.avgGradePct,
        elevationGain: n.elevationGain,
        elevationLoss: n.elevationLoss,
        midLat: n.midLat,
        midLon: n.midLon,
      }));

      const slopeGroupsExport = groups.map((g, i) => {
        // We only have start/end segment indices, map to point indices via those segments
        const startSeg = finalSegments[g.startIndex];
        const endSeg = finalSegments[g.endIndex];
        const startPtIdx = startSeg
          ? originalPoints.indexOf(startSeg.points[0])
          : 0;
        const endPtIdx = endSeg
          ? originalPoints.indexOf(endSeg.points[endSeg.points.length - 1])
          : startPtIdx;
        return {
          id: `g${i}`,
          type: g.type,
          startPointIndex: startPtIdx,
          endPointIndex: endPtIdx,
          distanceM: g.distance,
          elevationGainM: g.elevationGain,
          elevationLossM: g.elevationLoss,
          averageGradePct: g.averageGrade,
          durationSec: g.duration,
          averagePaceSecPerKm: g.averagePace,
        };
      });

      // Legs export with times reconstruction
      let legCumTime = 0;
      let legCumDist = 0;
      const legsExport = plan.legs.map((l, i) => {
        const startDistanceKm = legCumDist;
        legCumDist += l.distance / 1000;
        const startTimeSec = legCumTime;
        legCumTime += l.totalTimeSec;
        return {
          index: i,
          name: l.name,
          distanceM: l.distance,
          elevationGainM: l.elevationGain,
          elevationLossM: l.elevationLoss,
          movingTimeSec: l.movingTimeSec,
          stopTimeSec: l.stopTimeSec,
          totalTimeSec: l.totalTimeSec,
          averageTemperatureC: l.averageTemperatureC,
          startDistanceKm,
          endDistanceKm: legCumDist,
          startTimeSec,
          endTimeSec: legCumTime,
          associatedStopIndex: i < plan.legs.length - 1 ? i : undefined,
        };
      });

      const stopsExport = (config.stops || []).map((s, i) => {
        // Find nearest point index for cumulative distance/time
        let nearestIdx = 0;
        let bestDist = Infinity;
        for (let p = 0; p < pointsExport.length; p++) {
          const dLat = pointsExport[p].lat - s.coords.lat;
          const dLon = pointsExport[p].lon - s.coords.lon;
          const d2 = dLat * dLat + dLon * dLon;
          if (d2 < bestDist) {
            bestDist = d2;
            nearestIdx = p;
          }
        }
        const cumulativeDistanceKm =
          pointsExport[nearestIdx].distanceFromStartM / 1000;
        // approximate arrival time by finding segment containing this distance
        const segForStop = segmentsExport.find(
          (sg) =>
            cumulativeDistanceKm >= sg.startDistanceKm &&
            cumulativeDistanceKm <= sg.endDistanceKm
        );
        const arrivalTimeSec = segForStop?.startTimeSec;
        return {
          index: i,
          name: s.name,
          lat: s.coords.lat,
          lon: s.coords.lon,
          plannedStopDurationSec: s.duration,
          cumulativeDistanceKm,
          arrivalTimeSec,
        };
      });

      const averageCarbsPerHour =
        nutritionPlan.totals.choGrams / (totalDuration / 3600);

      const altitudes = originalPoints.map((p) => p.ele || 0);
      const altitudeMin = Math.min(...altitudes);
      const altitudeMax = Math.max(...altitudes);
      const temps = finalSegments
        .map((s) => s.temperatureC)
        .filter((t): t is number => typeof t === "number" && !isNaN(t));
      const tempMin = temps.length ? Math.min(...temps) : undefined;
      const tempMax = temps.length ? Math.max(...temps) : undefined;

      exportObj = {
        meta: {
          version: 1,
          generatedAt: new Date().toISOString(),
          raceName: config.raceName,
          source: {
            gpxFileName: path.basename(args.gpx),
            configFileName: path.basename(args.config),
          },
          configSnapshot: config,
        },
        points: pointsExport,
        segments: segmentsExport,
        slopeGroups: slopeGroupsExport,
        legs: legsExport,
        stops: stopsExport,
        nutrition: {
          perLeg: perLeg.legs.map((l) => ({
            legIndex: l.legIndex,
            legName: l.legName,
            carbsTargetG: l.carbsTargetG,
            carbsViaFlasksG: l.carbsViaFlasksG,
            carbsViaFoodsG: l.carbsViaFoodsG,
            hydrationLitres: l.hydrationLitres,
            carryLitres: l.carryLitres,
            flasksCount: l.flasksCount,
            pickupAtStart: l.pickupAtStart,
            selectedFoods: l.selectedFoods.map((f) => ({
              label: f.label,
              carbsG: f.carbsG,
              units: f.units,
              carbsPerUnitG:
                (f as any).carbsPerUnitG ??
                f.carbsG / Math.max(1, f.units || 1),
            })),
          })),
          totals: {
            carbsTargetG: perLeg.totals.carbsTargetG,
            carbsViaFlasksG: perLeg.totals.carbsViaFlasksG,
            carbsViaFoodsG: perLeg.totals.carbsViaFoodsG,
            hydrationLitres: perLeg.totals.hydrationLitres,
          },
          segments: nutritionSegmentsExport,
        },
        derived: {
          distanceKm: segmentsLength / 1000,
          elevationGainM: segmentsGain,
          elevationLossM: finalSegments.reduce(
            (a, s) => a + s.elevationLoss,
            0
          ),
          totalDurationSec: totalDuration,
          movingTimeSec: totalRunDuration,
          stopTimeSec: totalStopDuration,
          averageCarbsPerHour,
          altitude: { min: altitudeMin, max: altitudeMax },
          temperature:
            tempMin !== undefined && tempMax !== undefined
              ? { min: tempMin, max: tempMax }
              : undefined,
        },
        weather: {
          perKm: kmWeather.map((w) => ({
            km: w.distM / 1000,
            timeSec: w.timeSec,
            lat: w.lat,
            lon: w.lon,
            temperatureC: w.tempC,
            apparentTemperatureC: w.apparentC,
            humidityPct: w.humidityPct,
            precipitationMm: w.precipitationMm,
            rainMm: w.rainMm,
            snowfallCm: w.snowfallCm,
            cloudCoverPct: w.cloudCoverPct,
            windSpeed10mKmh: w.windSpeed10mKmh,
            windGusts10mKmh: w.windGusts10mKmh,
            shortwaveRadiationWm2: w.shortwaveRadiationWm2,
            sunshineDurationSec: w.sunshineDurationSec,
            isDay: w.isDay,
          })),
        },
        uiHints: {
          recommendedColorScale: {
            temperature: "viridis",
            carbs: "inferno",
          },
        },
      };
    }

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
      `Average carbs/hour: ${(nutritionPlan.totals.choGrams / (totalDuration / 3600)).toFixed(0)} g/h over ${formatHms(totalDuration)}`
    );

    console.log(
      `Totals (detailed): CHO ${perLeg.totals.carbsTargetG.toFixed(0)}g = drink ${perLeg.totals.carbsViaFlasksG.toFixed(0)}g + foods ${perLeg.totals.carbsViaFoodsG.toFixed(0)}g; hydration ${perLeg.totals.hydrationLitres.toFixed(1)} L`
    );

    if (args.json && exportObj) {
      try {
        const target = path.isAbsolute(args.json)
          ? args.json
          : path.resolve(process.env.INIT_CWD || process.cwd(), args.json);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, JSON.stringify(exportObj, null, 2), "utf8");
        console.log(`\nJSON export written to: ${target}`);
      } catch (e: any) {
        console.error(`Failed to write JSON export: ${e?.message || e}`);
      }
    }

    if (args.markdown) {
      const md = buildMarkdownAidStations({
        raceName: config.raceName,
        plan,
        perLeg,
        startTimeIso: config.startTime,
      });
      try {
        const target = path.isAbsolute(args.markdown)
          ? args.markdown
          : path.resolve(process.env.INIT_CWD || process.cwd(), args.markdown);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, md, "utf8");
        console.log(`\nMarkdown aid stations export written to: ${target}`);
      } catch (e: any) {
        console.error(`Failed to write markdown export: ${e?.message || e}`);
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

interface BuildMarkdownArgs {
  raceName?: string;
  plan: ReturnType<typeof computePlan>;
  perLeg: FullNutritionPlanPerLeg;
  startTimeIso?: string;
}

function buildMarkdownAidStations(args: BuildMarkdownArgs): string {
  const { raceName, plan, perLeg, startTimeIso } = args;
  const startDate = startTimeIso ? new Date(startTimeIso) : null;
  // Table headers
  const headers = [
    "#", // leg index
    "Section", // leg name
    "Km cum.",
    "+m / -m", // elevation
    "Durée (moving+stop)",
    "Heure passage", // arrival time at end of leg
    "Flasques", // number flasks to (re)fill for next leg
    "Remplir (L)", // litres to fill
    "Hydrat. besoin (L)",
    "CHO cible (g)",
    "CHO boisson (g)",
    "CHO solides (g)",
    "Aliments à donner",
    "Temp Ø (°C)",
  ];
  let lines: string[] = [];
  lines.push(`# Plan assistance – ${raceName || "Course"}`);
  lines.push("");
  lines.push(
    `Généré le ${new Date().toISOString()} – Hypothèses: rythme normalisé ${(
      plan.totals.distance / 1000
    ).toFixed(1)} km / +${plan.totals.elevationGain.toFixed(0)} m.`
  );
  lines.push("");
  lines.push(headers.join(" | "));
  lines.push(headers.map(() => "---").join(" | "));

  let cumulativeKm = 0;
  let cumulativeTimeSec = 0;
  for (let i = 0; i < plan.legs.length; i++) {
    const leg = plan.legs[i];
    const nut = perLeg.legs[i];
    cumulativeKm += leg.distance / 1000;
    cumulativeTimeSec += leg.totalTimeSec;
    const arrivalTime = startDate
      ? new Date(startDate.getTime() + cumulativeTimeSec * 1000)
      : null;
    const foodsStr =
      nut.selectedFoods
        .map((f) => {
          const caf =
            f.caffeineMgPerUnit && f.caffeineMgPerUnit > 0
              ? ` (${f.caffeineMgPerUnit}mg caf)`
              : "";
          return `${f.units}x ${f.label}${caf}`;
        })
        .join(", ") || "—";
    const line = [
      (i + 1).toString(),
      leg.name.replace(/\|/g, "/"),
      cumulativeKm.toFixed(1),
      `+${leg.elevationGain.toFixed(0)} / -${leg.elevationLoss.toFixed(0)}`,
      `${formatHms(leg.movingTimeSec)}+${formatHms(leg.stopTimeSec)}`,
      arrivalTime
        ? arrivalTime.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      nut.pickupAtStart.flasksToFill.toString(),
      nut.pickupAtStart.fillVolumeMl
        ? (nut.pickupAtStart.fillVolumeMl / 1000).toFixed(2)
        : "0",
      nut.hydrationLitres.toFixed(2),
      nut.carbsTargetG.toFixed(0),
      nut.carbsViaFlasksG.toFixed(0),
      nut.carbsViaFoodsG.toFixed(0),
      foodsStr,
      typeof leg.averageTemperatureC === "number"
        ? leg.averageTemperatureC.toFixed(1)
        : "",
    ];
    lines.push(line.join(" | "));
  }

  // Totals row
  const totals = perLeg.totals;
  lines.push("");
  lines.push(
    `**Totaux**: CHO ${totals.carbsTargetG.toFixed(0)} g = boisson ${totals.carbsViaFlasksG.toFixed(
      0
    )} g + solides ${totals.carbsViaFoodsG.toFixed(0)} g · Hydratation ${totals.hydrationLitres.toFixed(
      1
    )} L`
  );

  lines.push("");
  lines.push(
    `Légende: Flasques = nombre à (re)remplir pour la section suivante ; CHO = glucides ; Hydrat. besoin = estimation physiologique pour le segment.`
  );
  return lines.join("\n");
}
