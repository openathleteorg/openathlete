import * as d3 from "d3";
import { JSDOM } from "jsdom";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import { GpxPoint } from "./gpx";
import { GpxEnrichedSegment } from "./segments";
import { TrendGroup, colorForTrend } from "./slope-segmentation";
import { averageAltitudeM, haversineDistance } from "./utils";
import { RacePlanConfig } from "./config";
import { getOpenMeteoTemperatureC } from "./open-meteo";
import type { KmTemperatureSample } from "./weather";

export interface ElevationSample {
  dist: number; // meters from start
  ele: number; // meters
}

function trackTotalDistance(points: GpxPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const p = points[i];
    if (
      prev &&
      prev.lat != null &&
      prev.lon != null &&
      p &&
      p.lat != null &&
      p.lon != null
    ) {
      d += haversineDistance(prev, p);
    }
  }
  return d;
}

function cumulativeDistance(points: GpxPoint[]): ElevationSample[] {
  const out: ElevationSample[] = [];
  let d = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i > 0) {
      const prev = points[i - 1];
      if (
        prev &&
        prev.lat != null &&
        prev.lon != null &&
        p &&
        p.lat != null &&
        p.lon != null
      ) {
        d += haversineDistance(prev, p);
      }
    }
    if (p.ele != null) {
      out.push({ dist: d, ele: p.ele });
    }
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
  const lastSampleDist = samples[samples.length - 1].dist;

  const width = options?.width ?? 1000;
  const height = options?.height ?? 400;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };

  const x = d3
    .scaleLinear()
    .domain([0, lastSampleDist])
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

export async function renderElevationWithSegmentation(
  points: GpxPoint[],
  groups: TrendGroup[],
  options?: { width?: number; height?: number; outDir?: string; name?: string }
) {
  if (!points.length) return;
  const samples = cumulativeDistance(points);
  if (!samples.length) return;
  const lastSampleDist = samples[samples.length - 1].dist;

  const width = options?.width ?? 1200;
  const height = options?.height ?? 420;
  const margin = { top: 34, right: 30, bottom: 50, left: 60 };

  const x = d3
    .scaleLinear()
    .domain([0, lastSampleDist])
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

  // Background segmentation bars
  const baseline = y(d3.min(samples, (s: ElevationSample) => s.ele)!);
  const samplesMaxDist = lastSampleDist || 1;
  const groupsMaxDist = d3.max(groups, (g: TrendGroup) => g.endDist) || 1;
  const distScale = groupsMaxDist > 0 ? samplesMaxDist / groupsMaxDist : 1;
  for (const g of groups) {
    const x0 = x(g.startDist * distScale);
    const x1 = x(g.endDist * distScale);
    svg
      .append("rect")
      .attr("x", x0)
      .attr("y", margin.top)
      .attr("width", Math.max(0, x1 - x0))
      .attr("height", height - margin.bottom - margin.top)
      .attr("fill", colorForTrend(g.type))
      .attr("fill-opacity", 0.18);
  }

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
    .attr("fill-opacity", 0.9)
    .attr("stroke", "#1d4ed8")
    .attr("stroke-width", 1.5)
    .attr("d", area);

  const title = options?.name ?? "Elevation + segmentation";
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", 600)
    .text(title);

  // Legend
  const legend = [
    { label: "Big climb", color: colorForTrend("big_climb") },
    { label: "Small climb", color: colorForTrend("small_climb") },
    { label: "Flat", color: colorForTrend("flat") },
    { label: "Small descent", color: colorForTrend("small_descent") },
    { label: "Big descent", color: colorForTrend("big_descent") },
  ];
  const lx = width - margin.right - 140;
  let ly = margin.top + 6;
  for (const item of legend) {
    svg
      .append("rect")
      .attr("x", lx)
      .attr("y", ly - 10)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", item.color)
      .attr("fill-opacity", 0.5)
      .attr("stroke", item.color);
    svg
      .append("text")
      .attr("x", lx + 20)
      .attr("y", ly + 2)
      .text(item.label)
      .attr("alignment-baseline", "middle");
    ly += 18;
  }

  const outDir =
    options?.outDir ?? path.join("lab", "race-plan-generator", "dist");
  await fs.mkdir(outDir, { recursive: true });
  const svgContent = svg.node()?.outerHTML || "";
  const svgPath = path.join(outDir, "elevation-with-segmentation.svg");
  await fs.writeFile(svgPath, svgContent, "utf8");

  // PNG export
  const pngPath = path.join(outDir, "elevation-with-segmentation.png");
  try {
    const img = sharp(Buffer.from(svgContent), { density: 220 });
    await img
      .resize(width * 2, height * 2)
      .png({ compressionLevel: 9 })
      .toFile(pngPath);
    console.log(
      `Elevation profile with segmentation saved: ${svgPath} & ${pngPath}`
    );
  } catch (e) {
    console.warn("Could not render PNG:", (e as any)?.message || e);
  }
}

export async function renderSegmentMetrics(
  segments: GpxEnrichedSegment[],
  options?: { width?: number; height?: number; outDir?: string }
) {
  if (!segments.length) return;
  const width = options?.width ?? 1000;
  const height = options?.height ?? 360;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const outDir =
    options?.outDir ?? path.join("lab", "race-plan-generator", "dist");
  await fs.mkdir(outDir, { recursive: true });

  // Build x scale using cumulative distance at segment centers
  const centers = segments.map((s) => ({
    centerDist: (s.points.length ? s.points.length : 0) ? 0 : 0,
  }));
  // Compute cumulative distances
  let cum = 0;
  const xs: number[] = [];
  for (const s of segments) {
    const center = cum + (s.length || 0) / 2;
    xs.push(center);
    cum += s.length || 0;
  }

  const mkSvg = (title: string, yLabel: string) => {
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
    // title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .attr("font-size", 16)
      .attr("font-weight", 600)
      .text(title);
    // labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 12)
      .attr("text-anchor", "middle")
      .text("Distance (km)");
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .text(yLabel);
    return svg;
  };

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(xs) || 1])
    .range([margin.left, width - margin.right]);
  const xAxis = d3
    .axisBottom<number>(x)
    .ticks(12)
    .tickFormat((d: number) => `${(d / 1000).toFixed(1)} km`);

  // 1) speed multiplier (fatigue)
  {
    const data = segments.map((s, i) => ({
      x: xs[i],
      y: s.speedMultiplier ?? 1,
    }));
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.y)! * 0.98,
        d3.max(data, (d) => d.y)! * 1.02,
      ])
      .range([height - margin.bottom, margin.top]);
    const yAxis = d3
      .axisLeft<number>(y)
      .ticks(8)
      .tickFormat((d: number) => `${d.toFixed(2)}x`);
    const svg = mkSvg("Segment speed multiplier", "Speed x");
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#0ea5e9")
      .attr("stroke-width", 1.8)
      .attr("d", line);
    const svgContent = svg.node()?.outerHTML || "";
    const svgPath = path.join(outDir, "segments-speed-multiplier.svg");
    await fs.writeFile(svgPath, svgContent, "utf8");
  }

  // 2) altitude multiplier
  {
    const data = segments.map((s, i) => ({
      x: xs[i],
      y: s.altitudeSlowdownMultiplier ?? 1,
    }));
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.y)! * 0.98,
        d3.max(data, (d) => d.y)! * 1.02,
      ])
      .range([height - margin.bottom, margin.top]);
    const yAxis = d3
      .axisLeft<number>(y)
      .ticks(8)
      .tickFormat((d: number) => `${d.toFixed(2)}x`);
    const svg = mkSvg("Segment altitude multiplier", "Altitude x");
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 1.8)
      .attr("d", line);
    const svgContent = svg.node()?.outerHTML || "";
    const svgPath = path.join(outDir, "segments-altitude-multiplier.svg");
    await fs.writeFile(svgPath, svgContent, "utf8");
  }

  // 3) segment pace (min/km)
  {
    const data = segments.map((s, i) => ({ x: xs[i], y: s.averagePace }));
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.y)! * 0.98,
        d3.max(data, (d) => d.y)! * 1.02,
      ])
      .range([height - margin.bottom, margin.top]);
    const yAxis = d3
      .axisLeft<number>(y)
      .ticks(8)
      .tickFormat((d: number) => `${d.toFixed(2)} min/km`);
    const svg = mkSvg("Segment pace", "Pace (min/km)");
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 1.8)
      .attr("d", line);
    const svgContent = svg.node()?.outerHTML || "";
    const svgPath = path.join(outDir, "segments-pace.svg");
    await fs.writeFile(svgPath, svgContent, "utf8");
  }

  // 4) night multiplier
  {
    const data = segments.map((s, i) => ({
      x: xs[i],
      y: s.nightMultiplier ?? 1,
    }));
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.y)! * 0.98,
        d3.max(data, (d) => d.y)! * 1.02,
      ])
      .range([height - margin.bottom, margin.top]);
    const yAxis = d3
      .axisLeft<number>(y)
      .ticks(8)
      .tickFormat((d: number) => `${d.toFixed(2)}x`);
    const svg = mkSvg("Segment night multiplier", "Night x");
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#a855f7")
      .attr("stroke-width", 1.8)
      .attr("d", line);
    const svgContent = svg.node()?.outerHTML || "";
    const svgPath = path.join(outDir, "segments-night-multiplier.svg");
    await fs.writeFile(svgPath, svgContent, "utf8");
  }
}

export async function renderTemperatureChart(
  segments: GpxEnrichedSegment[],
  config: RacePlanConfig,
  options?: {
    width?: number;
    height?: number;
    outDir?: string;
    name?: string;
    kmSamples?: KmTemperatureSample[]; // if provided, reuse and do not fetch again
  }
): Promise<void> {
  if (!segments?.length) return;
  const width = options?.width ?? 1200;
  const height = options?.height ?? 420;
  const margin = { top: 36, right: 30, bottom: 50, left: 60 };
  const outDir =
    options?.outDir ?? path.join("lab", "race-plan-generator", "dist");

  // Build cumulative distance/time arrays and temperature samples at segment centers
  const hasStart = !!config.startTime;
  const startDate = hasStart
    ? new Date(config.startTime as string)
    : new Date();
  const centerData: {
    centerDist: number;
    centerTime: number;
    tempC: number;
  }[] = [];
  const timeBreaks: number[] = [0]; // seconds at segment starts (0 at start)
  const distBreaks: number[] = [0]; // meters at segment starts

  let cumDist = 0;
  let cumTime = 0;
  for (const s of segments) {
    const segLen = s.length || 0;
    const segDur = s.duration || 0;
    // center
    const centerDist = cumDist + segLen / 2;
    const centerTime = cumTime + segDur / 2; // seconds from start
    // compute temperature at center via Open-Meteo
    const midIdx = Math.max(0, Math.floor((s.points?.length || 1) / 2));
    const mid = s.points?.[Math.min(midIdx, (s.points?.length || 1) - 1)];
    const date = new Date(startDate.getTime() + centerTime * 1000);
    let tempC: number = 10;
    centerData.push({ centerDist, centerTime, tempC });

    // edges for piecewise mapping
    timeBreaks.push(cumTime + segDur);
    distBreaks.push(cumDist + segLen);
    cumDist += segLen;
    cumTime += segDur;
  }

  // Additionally, sample temperature every 1 km using Open-Meteo to provide a smoother curve
  // Prefer provided samples to avoid re-fetching
  let kmSamples: { centerDist: number; centerTime: number; tempC: number }[] =
    [];
  const totalDist = cumDist;
  if (options?.kmSamples && options.kmSamples.length) {
    // Map provided samples (distM, timeSec, tempC) to local structure
    kmSamples = options.kmSamples.map((s) => ({
      centerDist: s.distM,
      centerTime: s.timeSec,
      tempC: s.tempC,
    }));
  } else if (totalDist > 0 && hasStart) {
    const expectedCalls = Math.floor(totalDist / 1000);
    console.log(
      `[temperature] Open-Meteo km samples to fetch (approx): ${expectedCalls}`
    );
    let targetM = 1000; // start sampling at 1 km
    let segCumDist = 0;
    let segCumTime = 0;
    for (const s of segments) {
      const segLen = s.length || 0;
      const segDur = s.duration || 0;
      const segStartDist = segCumDist;
      const segEndDist = segCumDist + segLen;
      while (
        targetM <= totalDist &&
        targetM >= segStartDist &&
        targetM <= segEndDist &&
        segLen > 0
      ) {
        const t = (targetM - segStartDist) / segLen; // 0..1 within segment
        const sampleTime = segCumTime + t * segDur; // seconds from start
        const date = new Date(startDate.getTime() + sampleTime * 1000);
        // linear interpolate lat/lon inside the segment based on nearest points
        const count = s.points?.length || 1;
        const idx = Math.floor(t * Math.max(1, count - 1));
        const p0: GpxPoint | undefined =
          s.points?.[Math.max(0, Math.min(idx, count - 1))];
        const p1: GpxPoint | undefined =
          s.points?.[Math.max(0, Math.min(idx + 1, count - 1))] || p0;
        const segFrac = count > 1 ? t * (count - 1) - idx : 0;
        const lat =
          p0 && p1 ? p0.lat + (p1.lat - p0.lat) * segFrac : (p0?.lat ?? 0);
        const lon =
          p0 && p1 ? p0.lon + (p1.lon - p0.lon) * segFrac : (p0?.lon ?? 0);
        let tempC = 10;
        try {
          tempC = await getOpenMeteoTemperatureC({
            date,
            lat: lat ?? 0,
            lon: lon ?? 0,
          });
        } catch {}
        kmSamples.push({ centerDist: targetM, centerTime: sampleTime, tempC });
        targetM += 1000; // next kilometer
      }
      segCumDist += segLen;
      segCumTime += segDur;
      if (targetM > totalDist) break;
    }
  }

  if (!centerData.length) return;
  await fs.mkdir(outDir, { recursive: true });

  // Scales
  const xDist = d3
    .scaleLinear()
    .domain([0, cumDist || 1])
    .range([margin.left, width - margin.right]);

  // Piecewise linear scale mapping elapsed time (s) to the same pixel range, following distance-time mapping
  const xTime = d3
    .scaleLinear()
    .domain(timeBreaks)
    .range(distBreaks.map((d) => xDist(d)));

  const mins: number[] = [];
  const maxs: number[] = [];
  if (kmSamples.length) {
    mins.push(d3.min(kmSamples, (d) => d.tempC) as number);
    maxs.push(d3.max(kmSamples, (d) => d.tempC) as number);
  }
  const minV = mins.length ? (d3.min(mins) as number) : 0;
  const maxV = maxs.length ? (d3.max(maxs) as number) : 1;
  const y = d3
    .scaleLinear()
    .domain([minV - 2, maxV + 2])
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

  // Axes
  const xAxisDist = d3
    .axisBottom<number>(xDist)
    .ticks(12)
    .tickFormat((d: number) => `${(d / 1000).toFixed(1)} km`);

  const timeFmt = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };
  const xAxisTime = d3
    .axisTop<number>(xTime)
    .ticks(12)
    .tickFormat((s: number) => timeFmt(s));

  const yAxis = d3
    .axisLeft<number>(y)
    .ticks(8)
    .tickFormat((v: number) => `${v.toFixed(1)} °C`);

  // Draw axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxisDist);
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);
  svg
    .append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .call(xAxisTime);

  // Labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .text("Distance (km)");
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .text("Temps écoulé (hh:mm)");
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .text("Température (°C)");

  // Line
  const line = d3
    .line<{ centerDist: number; tempC: number }>()
    .x((d) => xDist(d.centerDist))
    .y((d) => y(d.tempC))
    .curve(d3.curveMonotoneX);

  if (kmSamples.length) {
    const lineKm = d3
      .line<{ centerDist: number; tempC: number }>()
      .x((d) => xDist(d.centerDist))
      .y((d) => y(d.tempC))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .datum(kmSamples)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.9)
      .attr("d", lineKm as any);
  }

  const title = options?.name ?? "Température (course)";
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", 600)
    .text(title);

  // Legend for lines
  const legendX = width - margin.right - 200;
  const legendY = margin.top + 6;
  const legend = svg
    .append("g")
    .attr("transform", `translate(${legendX}, ${legendY})`);
  legend
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 24)
    .attr("y2", 0)
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.9);
  legend
    .append("text")
    .attr("x", 30)
    .attr("y", 2)
    .text("Température (Open‑Meteo, 1 km)")
    .attr("alignment-baseline", "middle");

  const svgContent = svg.node()?.outerHTML || "";
  const svgPath = path.join(outDir, "temperature-distance-time.svg");
  await fs.writeFile(svgPath, svgContent, "utf8");

  // Export PNG
  const pngPath = path.join(outDir, "temperature-distance-time.png");
  try {
    const img = sharp(Buffer.from(svgContent), { density: 220 });
    await img
      .resize(width * 2, height * 2)
      .png({ compressionLevel: 9 })
      .toFile(pngPath);
    console.log(`Temperature chart saved: ${svgPath} & ${pngPath}`);
  } catch (e) {
    console.warn("Could not render PNG:", (e as any)?.message || e);
  }
}
