import path from "path";
import { promises as fs } from "fs";
import { loadActivityTrackPoints } from "./modules/gpx";
import {
  buildWindowsForActivity,
  computeActivityBaseline,
  normalizeEfficiencyForActivity,
  GAPWindow,
} from "./modules/processing";
import { buildGapModel, saveGapModel, GapModel } from "./modules/modeling";
import { generateComparisonChart } from "./modules/visual";

async function directoryGpxFiles(directoryPath: string): Promise<string[]> {
  const stats = await fs.stat(directoryPath);
  if (!stats.isDirectory())
    throw new Error(`${directoryPath} is not a directory`);
  const files = await fs.readdir(directoryPath);
  return files
    .filter((f) => f.toLowerCase().endsWith(".gpx"))
    .map((f) => path.join(directoryPath, f));
}

interface ActivityDiagnostic {
  file: string;
  skipped: boolean;
  reason?: string;
  windows: number;
  kept: number;
  baseline?: number;
  baselineWindows?: number;
  baselineTrimmed?: boolean;
}

async function processDirectory(directoryPath: string, fromDate?: Date) {
  const files = await directoryGpxFiles(directoryPath);
  if (!files.length) {
    console.warn(`No .gpx files in ${directoryPath}`);
    return;
  }
  console.log(`Found ${files.length} GPX file(s). Parsing & processing...`);

  const allWindows: GAPWindow[] = [];
  const diagnostics: ActivityDiagnostic[] = [];

  for (const file of files) {
    try {
      const points = await loadActivityTrackPoints(file);
      if (!points.length) {
        diagnostics.push({
          file: path.basename(file),
          skipped: true,
          reason: "no-points",
          windows: 0,
          kept: 0,
        });
        continue;
      }
      if (fromDate) {
        const firstTime = points[0].time;
        if (!firstTime || firstTime < fromDate) {
          diagnostics.push({
            file: path.basename(file),
            skipped: true,
            reason: "before-from",
            windows: 0,
            kept: 0,
          });
          continue;
        }
      }
      const windows = buildWindowsForActivity(points, path.basename(file));
      if (!windows.length) continue;
      const baseline = computeActivityBaseline(windows);
      const keptCount = windows.filter((w) => w.isValid).length;
      // Activity quality filters (Requirement 1):
      // - Need at least 8 valid windows
      // - Need at least 3 flat baseline windows (already inside baseline.windowsConsidered)
      // - Reject if baseline degenerate (==1 with insufficient baseline windows)
      if (
        keptCount < 8 ||
        baseline.windowsConsidered < 3 ||
        (baseline.baselineEfficiency === 1 && baseline.windowsConsidered < 5)
      ) {
        diagnostics.push({
          file: path.basename(file),
          skipped: true,
          reason:
            keptCount < 8
              ? "too-few-windows"
              : baseline.windowsConsidered < 3
                ? "no-flat"
                : "degenerate-baseline",
          windows: windows.length,
          kept: keptCount,
          baseline: baseline.baselineEfficiency,
          baselineWindows: baseline.windowsConsidered,
          baselineTrimmed: baseline.trimmed,
        });
        continue;
      }
      const normalized = normalizeEfficiencyForActivity(windows, baseline);
      allWindows.push(...normalized);
      diagnostics.push({
        file: path.basename(file),
        skipped: false,
        windows: windows.length,
        kept: keptCount,
        baseline: baseline.baselineEfficiency,
        baselineWindows: baseline.windowsConsidered,
        baselineTrimmed: baseline.trimmed,
      });
    } catch (e: any) {
      console.error(
        `Error processing ${path.basename(file)}:`,
        e?.message || e
      );
      diagnostics.push({
        file: path.basename(file),
        skipped: true,
        reason: "error",
        windows: 0,
        kept: 0,
      });
    }
  }

  const valid = allWindows.filter(
    (w) => w.isValid && isFinite(w.normalizedEfficiency!)
  );
  if (!valid.length) {
    console.error("No valid windows after processing; cannot build model.");
    return;
  }

  console.log(`Total valid windows: ${valid.length}`);
  const model = buildGapModel(valid);
  // attach diagnostics for transparency
  (model as any).diagnostics = diagnostics;
  (model as any).activityCountUsed = diagnostics.filter(
    (d) => !d.skipped
  ).length;
  (model as any).activityCountSkipped = diagnostics.filter(
    (d) => d.skipped
  ).length;
  await saveGapModel(model);
  console.log(
    `GAP model saved to dist/gap-model.json (activities used: ${(model as any).activityCountUsed}, skipped: ${(model as any).activityCountSkipped})`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const display = args.includes("--display");
  const fromArgIndex = args.findIndex((a) => a === "--from");
  let fromDate: Date | undefined;
  if (fromArgIndex !== -1) {
    const dateStr = args[fromArgIndex + 1];
    if (!dateStr) {
      console.error("--from flag requires a date value YYYY-MM-DD");
      process.exitCode = 1;
      return;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      console.error(`Invalid date for --from: ${dateStr}`);
      process.exitCode = 1;
      return;
    }
    fromDate = d;
  }
  const positional = args.filter((a) => !a.startsWith("-"));
  const firstArg = positional[0];

  if (display) {
    // Display mode: do NOT rebuild. Load existing JSON (optionally custom path)
    const modelPath =
      firstArg && firstArg.endsWith(".json")
        ? firstArg
        : path.resolve(
            process.env.INIT_CWD || process.cwd(),
            "lab",
            "gap-analyser",
            "dist",
            "gap-model.json"
          );

    const finalPath = path.isAbsolute(modelPath)
      ? modelPath
      : path.resolve(process.env.INIT_CWD || process.cwd(), modelPath);

    try {
      const raw = await fs.readFile(finalPath, "utf8");

      const model: GapModel = JSON.parse(raw);
      console.log(`Loaded GAP model from ${finalPath}`);
      await generateComparisonChart(model);
    } catch (e: any) {
      console.error(
        `Could not load model JSON at ${finalPath}. Run without --display to generate it first.`,
        e?.message || e
      );
      process.exitCode = 1;
    }
    return; // exit after display
  }

  if (!firstArg) {
    console.error(
      "Usage: pnpm gap-analyser start <directory> [--from YYYY-MM-DD] [--display] (with --display you may pass optional path/to/gap-model.json)"
    );
    process.exitCode = 1;
    return;
  }

  const resolvedPath = path.isAbsolute(firstArg)
    ? firstArg
    : path.resolve(process.env.INIT_CWD || process.cwd(), firstArg);

  console.log(`Building individual GAP model from directory: ${resolvedPath}`);
  if (fromDate)
    console.log(
      `Filtering activities from date >= ${fromDate.toISOString().split("T")[0]}`
    );
  await processDirectory(resolvedPath, fromDate);
}

main();
