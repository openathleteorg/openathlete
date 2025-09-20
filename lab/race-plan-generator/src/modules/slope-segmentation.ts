import { GpxEnrichedSegment } from "./segments";

export type TrendType =
  | "big_climb"
  | "small_climb"
  | "flat"
  | "small_descent"
  | "big_descent";

export interface TrendGroup {
  type: TrendType;
  startDist: number; // meters from start
  endDist: number; // meters from start
  distance: number; // meters
  elevationGain: number; // meters
  elevationLoss: number; // meters
  netElevation: number; // meters (gain - loss)
  averageGrade: number; // percent
  duration: number; // seconds (estimated, from enriched segments)
  averagePace: number; // min/km
  // indices of included base segments (for debugging)
  startIndex: number;
  endIndex: number; // inclusive
}

export interface SegmentationThresholds {
  upMinGradePct: number; // minimum abs grade to consider an uphill segment
  downMinGradePct: number; // minimum abs grade to consider a downhill segment
  flatAbsMaxGradePct: number; // |grade| <= this -> flat

  // Allow bridging short flats between same-direction groups
  bridgeFlatMaxDistanceM: number;

  // Allow bridging short opposite-trend wobbles (e.g., tiny dips inside a climb)
  bridgeOppositeMaxDistanceM: number;
  // Also limit opposite wobble by ratio w.r.t current group length
  bridgeOppositeMaxRatio: number; // e.g. 0.25 => opposite chunk <= 25% of current group

  // Sandwich merges: prev-trend | short-flat | same-trend → merge all
  sandwichFlatMaxDistanceM: number;
  sandwichFlatMaxRatio: number; // proportion of adjacent sum distance
  // Sandwich merges for opposite blips: up | short-down | up, and symmetric for down
  sandwichOppositeMaxDistanceM: number;
  sandwichOppositeMaxRatio: number;

  // Macro merge rules to keep very long climbs/descents intact
  macroFlatChunkMaxDistanceM: number; // max per-flat chunk to absorb inside macro climb/descent
  macroFlatTotalMaxDistanceM: number; // total flat distance allowed inside macro group
  macroOppositeChunkMaxLossM: number; // per opposite loss allowed (for climb) / gain for descent
  macroOppositeTotalMaxLossM: number; // total opposite loss allowed (for climb) / gain for descent
  macroOppositeTotalMaxDistanceM: number; // total opposite distance allowed

  // Big/small classification thresholds
  bigClimbMinGainM: number;
  bigClimbMinDistanceM: number;
  bigDescentMinLossM: number;
  bigDescentMinDistanceM: number;

  smallClimbMinGainM: number;
  smallDescentMinLossM: number;
  smallMinDistanceM: number;
}

export const DEFAULT_THRESHOLDS: SegmentationThresholds = {
  upMinGradePct: 2.0,
  downMinGradePct: 2.0,
  flatAbsMaxGradePct: 2.0,

  // Be less sensitive to tiny flats by allowing longer bridging
  bridgeFlatMaxDistanceM: 240,

  // Absorb only very short opposite blips to avoid flattening
  bridgeOppositeMaxDistanceM: 100,
  bridgeOppositeMaxRatio: 0.25,

  // Sandwich merges
  sandwichFlatMaxDistanceM: 400,
  sandwichFlatMaxRatio: 0.3,
  sandwichOppositeMaxDistanceM: 120,
  sandwichOppositeMaxRatio: 0.2,

  macroFlatChunkMaxDistanceM: 1000,
  macroFlatTotalMaxDistanceM: 2000,
  macroOppositeChunkMaxLossM: 100,
  macroOppositeTotalMaxLossM: 200,
  macroOppositeTotalMaxDistanceM: 2000,

  bigClimbMinGainM: 100,
  bigClimbMinDistanceM: 1000,
  bigDescentMinLossM: 100,
  bigDescentMinDistanceM: 1000,

  smallClimbMinGainM: 40,
  smallDescentMinLossM: 40,
  smallMinDistanceM: 300,
};

type BaseTrend = "up" | "down" | "flat";

function classifyBaseTrend(
  gradePct: number,
  t: SegmentationThresholds
): BaseTrend {
  if (Math.abs(gradePct) <= t.flatAbsMaxGradePct) return "flat";
  if (gradePct >= t.upMinGradePct) return "up";
  if (gradePct <= -t.downMinGradePct) return "down";
  return "flat";
}

export function groupSlopeSegments(
  segments: GpxEnrichedSegment[],
  thresholds: Partial<SegmentationThresholds> = {}
): TrendGroup[] {
  const t: SegmentationThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  if (!segments.length) return [];

  let cumDist = 0;
  const base: Array<{
    idx: number;
    start: number;
    end: number;
    length: number;
    gain: number;
    loss: number;
    grade: number;
    duration: number;
  }> = [];

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const start = cumDist;
    const end = start + (s.length || 0);
    cumDist = end;
    base.push({
      idx: i,
      start,
      end,
      length: s.length || 0,
      gain: s.elevationGain || 0,
      loss: s.elevationLoss || 0,
      grade: s.averageGrade || 0,
      duration: s.duration || 0,
    });
  }

  const groups: Array<{
    trend: BaseTrend;
    start: number;
    end: number;
    startIndex: number;
    endIndex: number;
    distance: number;
    gain: number;
    loss: number;
    duration: number;
  }> = [];

  let cur: (typeof groups)[number] | null = null;
  for (let i = 0; i < base.length; i++) {
    const b = base[i];
    const segTrend = classifyBaseTrend(b.grade, t);
    if (!cur) {
      cur = {
        trend: segTrend,
        start: b.start,
        end: b.end,
        startIndex: b.idx,
        endIndex: b.idx,
        distance: b.length,
        gain: b.gain,
        loss: b.loss,
        duration: b.duration,
      };
      continue;
    }

    if (segTrend === cur.trend) {
      // same trend, merge
      cur.end = b.end;
      cur.endIndex = b.idx;
      cur.distance += b.length;
      cur.gain += b.gain;
      cur.loss += b.loss;
      cur.duration += b.duration;
    } else if (
      // absorb short opposite wobble into current (e.g., tiny dip in a climb)
      cur.trend !== "flat" &&
      segTrend !== "flat" &&
      segTrend !== cur.trend &&
      b.length <= t.bridgeOppositeMaxDistanceM &&
      b.length <= cur.distance * t.bridgeOppositeMaxRatio
    ) {
      // ensure resulting average still reflects current trend sufficiently
      const newDistance = cur.distance + b.length;
      const newNet = cur.gain + b.gain - (cur.loss + b.loss);
      const newAvg = newDistance > 0 ? (newNet / newDistance) * 100 : 0;
      const keepUp = cur.trend === "up" && newAvg >= t.upMinGradePct * 0.75;
      const keepDown =
        cur.trend === "down" && newAvg <= -t.downMinGradePct * 0.75;
      if (keepUp || keepDown) {
        cur.end = b.end;
        cur.endIndex = b.idx;
        cur.distance += b.length;
        cur.gain += b.gain;
        cur.loss += b.loss;
        cur.duration += b.duration;
      } else {
        // start a new group instead to preserve trend clarity
        groups.push(cur);
        cur = {
          trend: segTrend,
          start: b.start,
          end: b.end,
          startIndex: b.idx,
          endIndex: b.idx,
          distance: b.length,
          gain: b.gain,
          loss: b.loss,
          duration: b.duration,
        };
      }
    } else if (
      segTrend === "flat" &&
      cur.trend !== "flat" &&
      b.length <= t.bridgeFlatMaxDistanceM
    ) {
      // bridge small flat into current uphill/downhill group
      cur.end = b.end;
      cur.endIndex = b.idx;
      cur.distance += b.length;
      cur.gain += b.gain;
      cur.loss += b.loss;
      cur.duration += b.duration;
    } else if (
      cur.trend === "flat" &&
      segTrend !== "flat" &&
      cur.distance <= t.bridgeFlatMaxDistanceM
    ) {
      // absorb short preceding flat into the new trend
      cur.trend = segTrend;
      cur.end = b.end;
      cur.endIndex = b.idx;
      cur.distance += b.length;
      cur.gain += b.gain;
      cur.loss += b.loss;
      cur.duration += b.duration;
    } else if (
      // absorb short preceding opposite wobble into the new dominant trend
      cur.trend !== "flat" &&
      segTrend !== "flat" &&
      cur.trend !== segTrend &&
      cur.distance <= t.bridgeOppositeMaxDistanceM
    ) {
      const newDistance = cur.distance + b.length;
      const newNet = cur.gain + b.gain - (cur.loss + b.loss);
      const newAvg = newDistance > 0 ? (newNet / newDistance) * 100 : 0;
      const okUp = segTrend === "up" && newAvg >= t.upMinGradePct * 0.75;
      const okDown = segTrend === "down" && newAvg <= -t.downMinGradePct * 0.75;
      if (okUp || okDown) {
        cur.trend = segTrend;
        cur.end = b.end;
        cur.endIndex = b.idx;
        cur.distance += b.length;
        cur.gain += b.gain;
        cur.loss += b.loss;
        cur.duration += b.duration;
      } else {
        groups.push(cur);
        cur = {
          trend: segTrend,
          start: b.start,
          end: b.end,
          startIndex: b.idx,
          endIndex: b.idx,
          distance: b.length,
          gain: b.gain,
          loss: b.loss,
          duration: b.duration,
        };
      }
    } else {
      groups.push(cur);
      cur = {
        trend: segTrend,
        start: b.start,
        end: b.end,
        startIndex: b.idx,
        endIndex: b.idx,
        distance: b.length,
        gain: b.gain,
        loss: b.loss,
        duration: b.duration,
      };
    }
  }
  if (cur) groups.push(cur);

  // Post-process: sandwich merges to avoid breaking long climbs/descents
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 1; i < groups.length - 1; i++) {
      const prev = groups[i - 1];
      const mid = groups[i];
      const next = groups[i + 1];
      // Flat sandwich: up|flat|up or down|flat|down
      if (
        mid.trend === "flat" &&
        prev.trend === next.trend &&
        prev.trend !== "flat"
      ) {
        const maxDistOk = mid.distance <= t.sandwichFlatMaxDistanceM;
        const ratioOk =
          mid.distance <=
          (prev.distance + next.distance) * t.sandwichFlatMaxRatio;
        if (maxDistOk && ratioOk) {
          // Merge prev + mid + next into one
          const merged = {
            trend: prev.trend,
            start: prev.start,
            end: next.end,
            startIndex: prev.startIndex,
            endIndex: next.endIndex,
            distance: prev.distance + mid.distance + next.distance,
            gain: prev.gain + mid.gain + next.gain,
            loss: prev.loss + mid.loss + next.loss,
            duration: prev.duration + mid.duration + next.duration,
          } as (typeof groups)[number];
          groups.splice(i - 1, 3, merged);
          changed = true;
          i--; // re-check at this position
          continue;
        }
      }
      // Opposite sandwich: up|short-down|up or down|short-up|down
      if (
        mid.trend !== "flat" &&
        prev.trend === next.trend &&
        prev.trend !== "flat" &&
        mid.trend !== prev.trend
      ) {
        const maxDistOk = mid.distance <= t.sandwichOppositeMaxDistanceM;
        const ratioOk =
          mid.distance <=
          (prev.distance + next.distance) * t.sandwichOppositeMaxRatio;
        if (maxDistOk && ratioOk) {
          // Check resulting average grade keeps dominant trend
          const newDistance = prev.distance + mid.distance + next.distance;
          const newGain = prev.gain + mid.gain + next.gain;
          const newLoss = prev.loss + mid.loss + next.loss;
          const newNet = newGain - newLoss;
          const newAvg = newDistance > 0 ? (newNet / newDistance) * 100 : 0;
          const keepUp =
            prev.trend === "up" && newAvg >= t.upMinGradePct * 0.75;
          const keepDown =
            prev.trend === "down" && newAvg <= -t.downMinGradePct * 0.75;
          if (keepUp || keepDown) {
            const merged = {
              trend: prev.trend,
              start: prev.start,
              end: next.end,
              startIndex: prev.startIndex,
              endIndex: next.endIndex,
              distance: newDistance,
              gain: newGain,
              loss: newLoss,
              duration: prev.duration + mid.duration + next.duration,
            } as (typeof groups)[number];
            groups.splice(i - 1, 3, merged);
            changed = true;
            i--;
            continue;
          }
        }
      }
    }
  }

  // Macro merge pass: merge extended up/down across allowable flats and small opposite dips
  const macroMerged: typeof groups = [];
  for (let i = 0; i < groups.length; ) {
    const g0 = groups[i];
    if (g0.trend === "up" || g0.trend === "down") {
      const targetTrend: BaseTrend = g0.trend;
      let j = i + 1;
      let acc: (typeof groups)[number] = { ...g0 };
      let flatTotal = 0;
      let oppLossOrGainTotal = 0; // loss for up, gain for down
      let oppDistTotal = 0;
      while (j < groups.length) {
        const g = groups[j];
        if (g.trend === targetTrend) {
          acc.end = g.end;
          acc.endIndex = g.endIndex;
          acc.distance += g.distance;
          acc.gain += g.gain;
          acc.loss += g.loss;
          acc.duration += g.duration;
          j++;
          continue;
        }
        if (g.trend === "flat") {
          const next = groups[j + 1];
          if (
            next &&
            next.trend === targetTrend &&
            g.distance <= t.macroFlatChunkMaxDistanceM &&
            flatTotal + g.distance <= t.macroFlatTotalMaxDistanceM
          ) {
            acc.end = g.end;
            acc.endIndex = g.endIndex;
            acc.distance += g.distance;
            acc.gain += g.gain;
            acc.loss += g.loss;
            acc.duration += g.duration;
            flatTotal += g.distance;
            j++;
            continue;
          }
          break;
        }
        // Opposite trend: allow limited opposite inside macro group
        else if (g.trend !== targetTrend) {
          const oppositeAmount = targetTrend === "up" ? g.loss : g.gain;
          const dist = g.distance;
          const withinChunk = oppositeAmount <= t.macroOppositeChunkMaxLossM;
          const withinTotals =
            oppLossOrGainTotal + oppositeAmount <=
              t.macroOppositeTotalMaxLossM &&
            oppDistTotal + dist <= t.macroOppositeTotalMaxDistanceM;
          const next = groups[j + 1];
          if (
            withinChunk &&
            withinTotals &&
            next &&
            next.trend === targetTrend
          ) {
            acc.end = g.end;
            acc.endIndex = g.endIndex;
            acc.distance += g.distance;
            acc.gain += g.gain;
            acc.loss += g.loss;
            acc.duration += g.duration;
            oppLossOrGainTotal += oppositeAmount;
            oppDistTotal += dist;
            j++;
            continue;
          }
          break;
        } else {
          break;
        }
      }
      // Ensure resulting average grade remains coherent with target trend
      const newAvg =
        acc.distance > 0 ? ((acc.gain - acc.loss) / acc.distance) * 100 : 0;
      const okUp = targetTrend === "up" && newAvg >= t.upMinGradePct * 0.6;
      const okDown =
        targetTrend === "down" && newAvg <= -t.downMinGradePct * 0.6;
      if (okUp || okDown) {
        macroMerged.push(acc);
        i = j;
      } else {
        macroMerged.push(g0);
        i = i + 1;
      }
    } else {
      macroMerged.push(g0);
      i++;
    }
  }
  groups.splice(0, groups.length, ...macroMerged);

  // Map to TrendGroup with classification big/small/flat
  const result: TrendGroup[] = groups
    .map((g) => {
      const net = g.gain - g.loss;
      const avgGrade = g.distance > 0 ? (net / g.distance) * 100 : 0;
      let type: TrendType = "flat";
      if (g.trend === "up") {
        const isBig =
          (g.gain >= t.bigClimbMinGainM ||
            g.distance >= t.bigClimbMinDistanceM) &&
          avgGrade >= t.upMinGradePct;
        const isSmall =
          g.gain >= t.smallClimbMinGainM &&
          g.distance >= t.smallMinDistanceM &&
          avgGrade >= t.upMinGradePct;
        type = isBig ? "big_climb" : isSmall ? "small_climb" : "flat";
      } else if (g.trend === "down") {
        const isBig =
          (g.loss >= t.bigDescentMinLossM ||
            g.distance >= t.bigDescentMinDistanceM) &&
          avgGrade <= -t.downMinGradePct;
        const isSmall =
          g.loss >= t.smallDescentMinLossM &&
          g.distance >= t.smallMinDistanceM &&
          avgGrade <= -t.downMinGradePct;
        type = isBig ? "big_descent" : isSmall ? "small_descent" : "flat";
      } else {
        type = "flat";
      }

      const avgPace =
        g.distance > 0 ? g.duration / 60 / (g.distance / 1000) : 0;
      const tg: TrendGroup = {
        type,
        startDist: g.start,
        endDist: g.end,
        distance: g.distance,
        elevationGain: g.gain,
        elevationLoss: g.loss,
        netElevation: net,
        averageGrade: avgGrade,
        duration: g.duration,
        averagePace: avgPace,
        startIndex: g.startIndex,
        endIndex: g.endIndex,
      };
      return tg;
    })
    // Optional: merge adjacent groups of same final type to avoid fragmentation
    .reduce((acc: TrendGroup[], cur) => {
      const last = acc[acc.length - 1];
      if (
        last &&
        last.type === cur.type &&
        Math.abs(last.endDist - cur.startDist) < 1e-6
      ) {
        // merge
        const distance = last.distance + cur.distance;
        const duration = last.duration + cur.duration;
        const netElevation = last.netElevation + cur.netElevation;
        const avgGrade = distance > 0 ? (netElevation / distance) * 100 : 0;
        const avgPace = distance > 0 ? duration / 60 / (distance / 1000) : 0;
        acc[acc.length - 1] = {
          ...last,
          endDist: cur.endDist,
          distance,
          elevationGain: last.elevationGain + cur.elevationGain,
          elevationLoss: last.elevationLoss + cur.elevationLoss,
          netElevation,
          averageGrade: avgGrade,
          duration,
          averagePace: avgPace,
          endIndex: cur.endIndex,
        };
      } else {
        acc.push(cur);
      }
      return acc;
    }, []);

  return result;
}

export function colorForTrend(type: TrendType): string {
  switch (type) {
    case "big_climb":
      return "#dc2626"; // red-600
    case "small_climb":
      return "#f59e0b"; // amber-500
    case "big_descent":
      return "#2563eb"; // blue-600
    case "small_descent":
      return "#60a5fa"; // blue-400
    case "flat":
    default:
      return "#9ca3af"; // gray-400
  }
}
