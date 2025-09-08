import { GAPWindow } from "./processing";
import { promises as fs } from "fs";
import path from "path";

export interface GradientBin {
  gradientMin: number; // inclusive
  gradientMax: number; // exclusive
  count: number;
  meanNormalizedEfficiency: number;
  stdNormalizedEfficiency: number;
}

export interface GapModel {
  createdAt: string;
  windowCount: number;
  bins: GradientBin[];
}

// Finer uniform binning (1% increments) to reduce aggregation bias at steep grades
// Range chosen symmetrical for running grades typically encountered.
const BIN_MIN = -30;
const BIN_MAX = 30;
const BIN_STEP = 0.5; // change for finer granularity
const BIN_EDGES: number[] = [];
for (let g = BIN_MIN; g <= BIN_MAX; g += BIN_STEP) BIN_EDGES.push(g);
if (BIN_EDGES[BIN_EDGES.length - 1] !== BIN_MAX) BIN_EDGES.push(BIN_MAX);

interface BinAccumulator {
  values: number[];
}

// Normalized efficiency plausible bounds (after per-activity normalization flat ≈1)
// Values far outside often arise from GPS noise (very low speed) or HR dropout.
const MIN_NORMALIZED_EFF = 0.7;
let MAX_NORMALIZED_EFF = 3.0; // will refine dynamically based on distribution

// Trim fraction for robust stats (remove extremes inside each bin)
const TRIM_FRACTION = 0.05; // 5% low & high

export function buildGapModel(windows: GAPWindow[]): GapModel {
  const valid = windows.filter(
    (w) =>
      w.isValid && w.avgGradientPct != null && w.normalizedEfficiency != null
  );

  // dynamic upper bound: 99th percentile of normalizedEfficiency (after base min filter)
  const prelim = valid
    .map((w) => w.normalizedEfficiency!)
    .filter((v) => v >= MIN_NORMALIZED_EFF && isFinite(v))
    .sort((a, b) => a - b);
  if (prelim.length > 20) {
    const pIdx = Math.floor(prelim.length * 0.99);
    const p99 = prelim[pIdx];
    MAX_NORMALIZED_EFF = Math.min(MAX_NORMALIZED_EFF, Math.max(1.6, p99));
  }
  const binsAcc: BinAccumulator[] = Array(BIN_EDGES.length - 1)
    .fill(null)
    .map(() => ({ values: [] }));

  for (const w of valid) {
    const g = w.avgGradientPct!;
    const eff = w.normalizedEfficiency!;
    if (eff < MIN_NORMALIZED_EFF || eff > MAX_NORMALIZED_EFF) continue; // outlier skip
    if (g < BIN_MIN || g >= BIN_MAX) continue;
    const binIndex = Math.floor((g - BIN_MIN) / BIN_STEP);
    if (binIndex >= 0 && binIndex < binsAcc.length) {
      binsAcc[binIndex].values.push(eff);
    }
  }

  const bins = binsAcc.map((acc, i) => {
    const vals = acc.values.slice().sort((a, b) => a - b);
    const count = vals.length;
    let mean = 0;
    let std = 0;
    if (count) {
      // trimmed subset
      const trim = Math.floor(count * TRIM_FRACTION);
      const core = vals.slice(trim, vals.length - trim || vals.length);
      const coreCount = core.length;
      mean = core.reduce((s, v) => s + v, 0) / coreCount;
      if (coreCount > 1) {
        std = Math.sqrt(
          core.reduce((s, v) => s + (v - mean) ** 2, 0) / (coreCount - 1)
        );
      }
    }
    return {
      gradientMin: BIN_EDGES[i],
      gradientMax: BIN_EDGES[i + 1],
      count,
      meanNormalizedEfficiency: mean || 0,
      stdNormalizedEfficiency: std || 0,
    };
  });

  return {
    createdAt: new Date().toISOString(),
    windowCount: valid.length,
    bins,
  };
}

export async function saveGapModel(model: GapModel, outDir = "dist") {
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, "gap-model.json");
  await fs.writeFile(file, JSON.stringify(model, null, 2), "utf8");
}
