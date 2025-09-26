import { GpxPoint } from "./gpx";
import { GpxEnrichedSegment } from "./segments";
import { RacePlanConfig } from "./config";
import { averageAltitudeM } from "./utils";
import { createTemperatureModel, tempSlowMultiplier } from "./temperature";

export function applyTemperatureSlowdown(
  segments: GpxEnrichedSegment[],
  points: GpxPoint[],
  config: RacePlanConfig
): GpxEnrichedSegment[] {
  if (!segments.length || !points.length) return segments;
  const startIso = config.startTime;
  if (!startIso) return segments;
  const startDate = new Date(startIso);
  const tempAt = createTemperatureModel();

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
    const tempC = tempAt({
      date: segCenterDate,
      lat: mid?.lat ?? 0,
      lon: mid?.lon ?? 0,
      altitudeM: averageAltitudeM(s),
    });
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
