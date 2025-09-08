import { GapModel } from "./modeling";
import { promises as fs } from "fs";
import path from "path";
import * as d3 from "d3";
import { JSDOM } from "jsdom";
import sharp from "sharp";

// Strava VAP polynomial: f(x) returns time ratio vs flat. We compare efficiency ratio.
export function stravaPolynomial(x: number): number {
  return (
    0.990554879163107 +
    0.032844586542411 * x +
    0.002148347700774 * Math.pow(x, 2) -
    0.000004498739573 * Math.pow(x, 3) -
    0.000000598866801 * Math.pow(x, 4)
  );
}

interface ChartPoint {
  gradient: number;
  modelEfficiency: number | null;
  modelStd: number | null;
  stravaRatio: number;
}

interface BinCenter {
  g: number; // center gradient
  mean: number;
  std: number;
  count: number;
}

function gaussian(x: number, bw: number) {
  const r = x / bw;
  return Math.exp(-0.5 * r * r);
}

function buildBinCenters(model: GapModel): BinCenter[] {
  return model.bins
    .filter((b) => b.count > 0)
    .map((b) => ({
      g: b.gradientMin + (b.gradientMax - b.gradientMin) / 2,
      mean: b.meanNormalizedEfficiency,
      std: b.stdNormalizedEfficiency,
      count: b.count,
    }))
    .sort((a, b) => a.g - b.g);
}

/**
 * Produce a smoothly interpolated curve using Gaussian kernel smoothing over bin centers.
 * bandwidth is in gradient percentage points (e.g. 1.5 means influence tapers over ~±3%).
 */
function smoothCurve(
  centers: BinCenter[],
  step = 0.25,
  bandwidth = 1.5
): ChartPoint[] {
  if (!centers.length) return [];
  const minG = centers[0].g;
  const maxG = centers[centers.length - 1].g;
  const pts: ChartPoint[] = [];
  for (let g = minG; g <= maxG + 1e-6; g += step) {
    let wSum = 0;
    let meanSum = 0;
    let upperSum = 0;
    let lowerSum = 0;
    for (const c of centers) {
      const w = gaussian(g - c.g, bandwidth) * Math.sqrt(c.count); // weight counts to stabilize sparse bins
      if (w < 1e-6) continue;
      wSum += w;
      meanSum += w * c.mean;
      upperSum += w * (c.mean + c.std);
      lowerSum += w * (c.mean - c.std);
    }
    if (wSum === 0) continue;
    const smMean = meanSum / wSum;
    const smUpper = upperSum / wSum;
    const smLower = lowerSum / wSum;
    const smStd = Math.max(0, (smUpper - smLower) / 2);
    pts.push({
      gradient: g,
      modelEfficiency: smMean,
      modelStd: smStd,
      stravaRatio: stravaPolynomial(g),
    });
  }
  return pts;
}

export async function generateComparisonChart(model: GapModel) {
  const centers = buildBinCenters(model);
  const data = smoothCurve(centers, 0.25, 1.5); // step 0.25%, bandwidth 1.5%
  if (!data.length) return;
  const width = 900;
  const height = 520;
  const margin = { top: 50, right: 120, bottom: 60, left: 70 };

  const gradients = data.map((d) => d.gradient);
  const x = d3
    .scaleLinear()
    .domain([d3.min(gradients) ?? -30, d3.max(gradients) ?? 30])
    .range([margin.left, width - margin.right]);

  const yVals = data
    .flatMap((d) => [d.modelEfficiency, d.stravaRatio])
    .filter((v): v is number => v != null && isFinite(v));

  const y = d3
    .scaleLinear()
    .domain([d3.min(yVals)! * 0.9, d3.max(yVals)! * 1.05])
    .range([height - margin.bottom, margin.top]);

  const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  const document = dom.window.document;
  const svg = d3
    .select(document.body)
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("font-family", "system-ui, sans-serif")
    .attr("font-size", 12);

  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#ffffff");

  const xAxis = d3
    .axisBottom<number>(x)
    .ticks(16)
    .tickFormat((d: number) => d + "%");
  const yAxis = d3
    .axisLeft<number>(y)
    .ticks(10)
    .tickFormat((d: number) => d.toFixed(2));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .text("Gradient (%)");
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .text("Normalized efficiency ratio");

  // Model line
  const modelLine = d3
    .line<ChartPoint>()
    .defined((d: ChartPoint) => d.modelEfficiency != null)
    .x((d: ChartPoint) => x(d.gradient))
    .y((d: ChartPoint) => y(d.modelEfficiency!))
    .curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(data.filter((d) => d.modelEfficiency != null))
    .attr("fill", "none")
    .attr("stroke", "#1d4ed8")
    .attr("stroke-width", 2)
    .attr("d", modelLine);

  // Confidence band (±1 std)
  const area = d3
    .area<ChartPoint>()
    .defined((d: ChartPoint) => d.modelEfficiency != null && d.modelStd != null)
    .x((d: ChartPoint) => x(d.gradient))
    .y0((d: ChartPoint) => y(d.modelEfficiency! - d.modelStd!))
    .y1((d: ChartPoint) => y(d.modelEfficiency! + d.modelStd!))
    .curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(data.filter((d) => d.modelEfficiency != null && d.modelStd != null))
    .attr("fill", "rgba(29,78,216,0.15)")
    .attr("stroke", "none")
    .attr("d", area);

  // Strava polynomial line
  const stravaLine = d3
    .line<ChartPoint>()
    .x((d: ChartPoint) => x(d.gradient))
    .y((d: ChartPoint) => y(d.stravaRatio))
    .curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#22c55e")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5")
    .attr("d", stravaLine);

  // Legend
  const legend = svg
    .append("g")
    .attr(
      "transform",
      `translate(${width - margin.right + 10}, ${margin.top})`
    );
  const items = [
    { color: "#1d4ed8", text: "Personal model (mean)" },
    { color: "rgba(29,78,216,0.15)", text: "±1σ", box: true },
    { color: "#22c55e", text: "Strava polynomial", dash: true },
  ];
  items.forEach((it, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 22})`);
    if (it.box) {
      g.append("rect")
        .attr("x", 0)
        .attr("y", -8)
        .attr("width", 26)
        .attr("height", 16)
        .attr("fill", it.color)
        .attr("stroke", "#1d4ed8")
        .attr("stroke-width", 1);
    } else {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", 26)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", it.color)
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", it.dash ? "5,5" : null);
    }
    g.append("text")
      .attr("x", 32)
      .attr("y", 4)
      .attr("font-size", 12)
      .text(it.text);
  });

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", "600")
    .text("Normalized Efficiency vs Gradient (Model vs Strava)");

  const outDir = "dist";
  await fs.mkdir(outDir, { recursive: true });
  const svgContent = svg.node()?.outerHTML || "";
  const svgPath = path.join(outDir, "gap-model-comparison.svg");
  await fs.writeFile(svgPath, svgContent, "utf8");

  // Also export high-res JPEG
  const jpegPath = path.join(outDir, "gap-model-comparison.jpg");
  try {
    const img = sharp(Buffer.from(svgContent), { density: 300 });
    await img
      .resize(width * 2, height * 2)
      .jpeg({ quality: 95, progressive: true, mozjpeg: true })
      .toFile(jpegPath);
    console.log(`Comparison chart saved: ${svgPath} & ${jpegPath}`);
  } catch (e) {
    console.warn("Could not render JPEG:", (e as any)?.message || e);
  }
}
