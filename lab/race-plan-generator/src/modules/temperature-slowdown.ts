import { GpxPoint } from "./gpx";
import { GpxEnrichedSegment } from "./segments";
import { RacePlanConfig } from "./config";
import { averageAltitudeM } from "./utils";
import { tempSlowMultiplier } from "./temperature";
import { KmTemperatureSample, getNearestKmSampleByTime } from "./weather";
import { getOpenMeteoTemperatureC } from "./open-meteo";

export async function applyTemperatureSlowdown(
  segments: GpxEnrichedSegment[],
  points: GpxPoint[],
  config: RacePlanConfig,
  kmSamples?: KmTemperatureSample[]
): Promise<GpxEnrichedSegment[]> {
  if (!segments.length || !points.length) return segments;
  const startIso = config.startTime;
  if (!startIso) return segments;
  const startDate = new Date(startIso);

  // Iterate segments accumulating time and apply temperature multiplier when center instant occurs
  let cumulativeSec = 0;
  const out: GpxEnrichedSegment[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const move = s.duration || 0;
    const segCenterOffset = cumulativeSec + move / 2;
    const segCenterDate = new Date(
      startDate.getTime() + segCenterOffset * 1000
    );
    const midIdx = Math.floor(s.points.length / 2);
    const mid = s.points[Math.max(0, Math.min(s.points.length - 1, midIdx))];
    // Use nearest precomputed sample by absolute time from start
    let tempC =
      getNearestKmSampleByTime(kmSamples || [], segCenterOffset)?.tempC ?? NaN;
    if (!Number.isFinite(tempC)) {
      try {
        tempC = await getOpenMeteoTemperatureC({
          date: segCenterDate,
          lat: mid?.lat ?? 0,
          lon: mid?.lon ?? 0,
        });
      } catch {
        tempC = 10;
      }
    }
    const tempMult = tempSlowMultiplier(tempC);
    const newDuration = move * tempMult;
    out.push({
      ...s,
      duration: newDuration,
      averagePace: newDuration / 60 / ((s.length || 1) / 1000),
      // keep existing annotations (altitude, speed, night) and add temperature multiplier for debug
      temperatureC: tempC,
      temperatureMultiplier: tempMult > 1 ? tempMult : undefined,
    });
    cumulativeSec += newDuration;
  }

  return out;
}
