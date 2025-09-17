import * as d3 from "d3";
import { JSDOM } from "jsdom";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import { GpxPoint } from "./gpx";
import { haversineDistance } from "./utils";

export interface ElevationSample {
  dist: number; // meters from start
  ele: number; // meters
}

function cumulativeDistance(points: GpxPoint[]): ElevationSample[] {
  const out: ElevationSample[] = [];
  let d = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.ele == null) continue; // skip points without elevation
    if (i > 0) {
      const prev = points[i - 1];
      if (prev && prev.lat != null && p.lat != null) {
        d += haversineDistance(prev, p);
      }
    }
    out.push({ dist: d, ele: p.ele });
  }
  return out;
}

export async function renderElevationProfile(
  points: GpxPoint[],
  options?: { width?: number; height?: number; outDir?: string; name?: string }
) {
  if (!points.length) return;
  const samples = cumulativeDistance(points);
  if (!samples.length) return;

  const width = options?.width ?? 1000;
  const height = options?.height ?? 400;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(samples, (d: ElevationSample) => d.dist)!])
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([
      d3.min(samples, (d: ElevationSample) => d.ele)! * 0.98,
      d3.max(samples, (d: ElevationSample) => d.ele)! * 1.02,
    ])
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
    .ticks(12)
    .tickFormat((d: number) => `${(d / 1000).toFixed(1)} km`);
  const yAxis = d3
    .axisLeft<number>(y)
    .ticks(10)
    .tickFormat((d: number) => `${d.toFixed(0)} m`);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Distance (km)");
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Elevation (m)");

  const area = d3
    .area<ElevationSample>()
    .x((d: ElevationSample) => x(d.dist))
    .y0(y(d3.min(samples, (s: ElevationSample) => s.ele)!))
    .y1((d: ElevationSample) => y(d.ele))
    .curve(d3.curveMonotoneX);

  svg
    .append("path")
    .datum(samples)
    .attr("fill", "#93c5fd")
    .attr("stroke", "#1d4ed8")
    .attr("stroke-width", 1.5)
    .attr("d", area);

  const title = options?.name ?? "Elevation profile";
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", 600)
    .text(title);

  const outDir =
    options?.outDir ?? path.join("lab", "race-plan-generator", "dist");
  await fs.mkdir(outDir, { recursive: true });
  const svgContent = svg.node()?.outerHTML || "";
  const svgPath = path.join(outDir, "elevation-profile.svg");
  await fs.writeFile(svgPath, svgContent, "utf8");

  // Export PNG at 2x for clarity
  const pngPath = path.join(outDir, "elevation-profile.png");
  try {
    const img = sharp(Buffer.from(svgContent), { density: 220 });
    await img
      .resize(width * 2, height * 2)
      .png({ compressionLevel: 9 })
      .toFile(pngPath);
    console.log(`Elevation profile saved: ${svgPath} & ${pngPath}`);
  } catch (e) {
    console.warn("Could not render PNG:", (e as any)?.message || e);
  }
}
