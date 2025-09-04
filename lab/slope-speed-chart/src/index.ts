#!/usr/bin/env node

import { parseGPXWithCustomParser } from "@we-gold/gpxjs";
import { promises as fs } from "node:fs";
import { resolve } from "path";
import * as d3 from "d3";
import { JSDOM } from "jsdom";
import sharp from "sharp";
import { DOMParser } from "xmldom-qsa";

type TrackPoint = {
  lat: number;
  lon: number;
  elevation?: number | null;
  time?: Date | null;
  cadence?: number | null;
  heartrate?: number | null;
};

interface PointMetricsRow {
  index: number;
  time: string;
  lat: number;
  lon: number;
  ele: number | null;
  dist_from_start_m: number;
  window_dist_m: number;
  slope_pct: number | null;
  speed_m_s: number | null;
  speed_km_h: number | null;
  cadence?: number | null;
  heartrate?: number | null;
}

const EARTH_RADIUS_M = 6371000;

function toRad(v: number): number {
  return (v * Math.PI) / 180;
}

function haversineMeters(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

function computePointMetrics(
  points: TrackPoint[],
  windowDistanceMeters: number
): PointMetricsRow[] {
  if (points.length < 2) return [];
  const cumulativeDist: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const d = haversineMeters(points[i - 1], points[i]);
    cumulativeDist[i] = cumulativeDist[i - 1] + d;
  }

  function findIndexByDistance(startIndex: number, targetDist: number): number {
    let j = startIndex + 1;
    while (
      j < points.length &&
      cumulativeDist[j] - cumulativeDist[startIndex] < targetDist
    ) {
      j++;
    }
    if (j >= points.length) return points.length - 1;
    return j;
  }

  const rows: PointMetricsRow[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const j = findIndexByDistance(i, windowDistanceMeters);
    const q = points[j];
    const windowDist = cumulativeDist[j] - cumulativeDist[i];

    let slope: number | null = null;
    let speedMS: number | null = null;
    let speedKmh: number | null = null;

    const eleP = p.elevation ?? null;
    const eleQ = q.elevation ?? null;
    if (eleP != null && eleQ != null && windowDist > 0.5) {
      const deltaEle = eleQ - eleP; // meters
      slope = (deltaEle / windowDist) * 100;
    }
    if (p.time && q.time && windowDist > 0.01) {
      const dt = (q.time.getTime() - p.time.getTime()) / 1000; // s
      if (dt > 0) {
        speedMS = windowDist / dt;
        speedKmh = speedMS * 3.6;
      }
    }

    rows.push({
      index: i,
      time: p.time ? p.time.toISOString() : "",
      lat: p.lat,
      lon: p.lon,
      ele: eleP,
      dist_from_start_m: cumulativeDist[i],
      window_dist_m: windowDist,
      slope_pct: slope,
      speed_m_s: speedMS,
      speed_km_h: speedKmh,
      cadence: p.cadence ?? null,
      heartrate: p.heartrate ?? null,
    });
  }
  const last = points[points.length - 1];
  rows.push({
    index: points.length - 1,
    time: last.time ? last.time.toISOString() : "",
    lat: last.lat,
    lon: last.lon,
    ele: last.elevation ?? null,
    dist_from_start_m: cumulativeDist[cumulativeDist.length - 1],
    window_dist_m: 0,
    slope_pct: null,
    speed_m_s: null,
    speed_km_h: null,
    cadence: last.cadence ?? null,
    heartrate: last.heartrate ?? null,
  });
  return rows;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function parseGpxFile(rawPath: string): Promise<TrackPoint[]> {
  let candidate = rawPath;

  if (!(await fileExists(candidate))) {
    candidate = resolve(process.cwd(), "..", "..", rawPath);
    if (!(await fileExists(candidate))) {
      candidate = resolve(process.cwd(), "..", rawPath);
      if (!(await fileExists(candidate))) {
        candidate = resolve(process.cwd(), rawPath);
      }
    }
  }

  const absolutePath = resolve(candidate);
  const data = await fs.readFile(absolutePath, "utf8");
  const [parsedFile, error] = parseGPXWithCustomParser(data, (txt) => {
    const doc = new DOMParser().parseFromString(txt, "text/xml");
    return doc;
  });

  if (error) throw error;

  const track = parsedFile.tracks[0];
  if (!track) {
    throw new Error("No track found in the GPX file.");
  }

  return track.points.map((pt: any) => ({
    lat: pt.latitude,
    lon: pt.longitude,
    elevation: pt.elevation ?? pt.ele ?? null,
    time: pt.time ? new Date(pt.time) : null,
    cadence: pt.extensions?.["gpxtpx:TrackPointExtension"]
      ? pt.extensions["gpxtpx:TrackPointExtension"]["gpxtpx:cad"]
      : null,
    heartrate: pt.extensions?.["gpxtpx:TrackPointExtension"]
      ? pt.extensions["gpxtpx:TrackPointExtension"]["gpxtpx:hr"]
      : null,
  }));
}

function polynomialFunction(x: number): number {
  return (
    0.990554879163107 +
    0.032844586542411 * x +
    0.002148347700774 * Math.pow(x, 2) -
    0.000004498739573 * Math.pow(x, 3) -
    0.000000598866801 * Math.pow(x, 4)
  );
}

function generatePolynomialPoints(
  xExtent: [number, number],
  baseSpeed: number,
  yMax: number
): { gradient: number; speed: number }[] {
  const points: { gradient: number; speed: number }[] = [];
  const [xMin, xMax] = xExtent;
  const numPoints = 200;

  for (let i = 0; i <= numPoints; i++) {
    const gradient = xMin + (i / numPoints) * (xMax - xMin);
    const timeRatio = polynomialFunction(gradient);
    const speed = baseSpeed / timeRatio;

    if (speed > 0 && speed < yMax * 1.2 && timeRatio > 0) {
      points.push({ gradient, speed });
    }
  }

  return points;
}

async function generateVisualization(
  valid: PointMetricsRow[],
  windowDistance: number
): Promise<void> {
  const width = 800;
  const height = 500;
  const margin = { top: 40, right: 30, bottom: 60, left: 70 };
  const baseSpeed = 10;

  const xExtent = d3.extent(
    valid,
    (d: PointMetricsRow) => d.slope_pct as number
  ) as [number, number];
  const padX = (xExtent[1] - xExtent[0]) * 0.05;
  const x = d3
    .scaleLinear()
    .domain([xExtent[0] - padX, xExtent[1] + padX])
    .range([margin.left, width - margin.right]);

  const coloredBy: keyof PointMetricsRow = "cadence";
  const yMaxColor = d3.max(
    valid,
    (d: PointMetricsRow) => d[coloredBy] as number
  ) as number;
  const yMinColor = d3.min(
    valid,
    (d: PointMetricsRow) => d[coloredBy] as number
  ) as number;
  const yMax = d3.max(
    valid,
    (d: PointMetricsRow) => d.speed_km_h as number
  ) as number;
  const y = d3
    .scaleLinear()
    .domain([0, yMax * 1.05])
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
    .ticks(10)
    .tickFormat((d: number) => d + "%");
  const yAxis = d3
    .axisLeft<number>(y)
    .ticks(10)
    .tickFormat((d: number) => d + " km/h");

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
    .text("Pente (%)");
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .text("Vitesse (km/h)");

  const color = d3
    .scaleSequential(d3.interpolateTurbo)
    .domain([yMinColor, yMaxColor]);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#888")
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.3)
    .selectAll("circle-bg")
    .data(valid)
    .join("circle")
    .attr("cx", (d: PointMetricsRow) => x(d.slope_pct as number))
    .attr("cy", (d: PointMetricsRow) => y(d.speed_km_h as number))
    .attr("r", 3);

  svg
    .append("g")
    .attr("stroke", "#222")
    .attr("stroke-width", 0.4)
    .attr("opacity", 0.85)
    .selectAll("circle")
    .data(valid)
    .join("circle")
    .attr("fill", (d: PointMetricsRow) => color(d[coloredBy] || 0))
    .attr("cx", (d: PointMetricsRow) => x(d.slope_pct as number))
    .attr("cy", (d: PointMetricsRow) => y(d.speed_km_h as number))
    .attr("r", 1);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", "600")
    .text(`Slope vs Speed (window ${windowDistance}m)`);

  addLegend(svg, color, yMaxColor, width, height, margin);
  addPolynomialCurve(svg, x, y, xExtent, baseSpeed, yMax);
  await saveAsJpeg(svg, width, height);
}

function addLegend(
  svg: any,
  color: any,
  yMaxColor: number,
  width: number,
  height: number,
  margin: any
): void {
  const legendHeight = 200;
  const legendWidth = 12;
  const legendX = width - margin.right - legendWidth - 10;
  const legendY = margin.top;
  const legendSteps = 50;
  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(${legendX},${legendY})`);

  for (let i = 0; i < legendSteps; i++) {
    const t = i / (legendSteps - 1);
    const v = yMaxColor * (1 - t);
    legendGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", (legendHeight / legendSteps) * i)
      .attr("width", legendWidth)
      .attr("height", legendHeight / legendSteps + 1)
      .attr("fill", color(v));
  }

  const legendScaleAxis = d3
    .scaleLinear()
    .domain([yMaxColor, 0])
    .range([0, legendHeight]);
  const legendAxis = d3
    .axisRight(legendScaleAxis)
    .ticks(6)
    .tickFormat((d) => `${d} BPM`);
  legendGroup
    .append("g")
    .attr("transform", `translate(${legendWidth},0)`)
    .call(legendAxis);
}

function addPolynomialCurve(
  svg: any,
  x: any,
  y: any,
  xExtent: [number, number],
  baseSpeed: number,
  yMax: number
): void {
  const polynomialPoints = generatePolynomialPoints(xExtent, baseSpeed, yMax);

  svg
    .append("g")
    .attr("transform", `translate(${x.range()[0] + 20}, ${y.range()[1] + 20})`)
    .call((g: any) => {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#22c55e")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
      g.append("text")
        .attr("x", 25)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .attr("font-size", 12)
        .text("Polynomial curve");
    });

  const line = d3
    .line<{ gradient: number; speed: number }>()
    .x((d) => x(d.gradient))
    .y((d) => y(d.speed))
    .curve(d3.curveMonotoneX);

  if (polynomialPoints.length > 1) {
    svg
      .append("path")
      .datum(polynomialPoints)
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", 0.8)
      .attr("d", line);
  }
}

async function saveAsJpeg(
  svg: any,
  width: number,
  height: number
): Promise<void> {
  const outDir = resolve(process.cwd(), "dist");
  try {
    await fs.mkdir(outDir, { recursive: true });
  } catch {}

  const svgContent = svg.node()?.outerHTML || "";
  try {
    const jpegPath = resolve(outDir, "slope-speed.jpg");
    const img = sharp(Buffer.from(svgContent), {
      density: 300,
    });
    await img
      .resize(width * 3, height * 3)
      .jpeg({
        quality: 95,
        progressive: true,
        mozjpeg: true,
      })
      .toFile(jpegPath);
    console.log(`JPEG generated: ${jpegPath} (${width * 3}x${height * 3}px)`);
  } catch (e) {
    console.error("Error during JPEG conversion:", e);
  }
}

async function main() {
  const [, , rawPath, rawWindow] = process.argv;

  if (!rawPath) {
    console.error("Usage: pnpm slope-speed-chart start <file.gpx>");
    process.exitCode = 1;
    return;
  }

  if (!rawPath.toLowerCase().endsWith(".gpx")) {
    console.error("Error: the file must have a .gpx extension.");
    process.exitCode = 1;
    return;
  }

  try {
    const windowDistance = rawWindow ? Math.max(1, Number(rawWindow)) : 100;
    const rawPoints = await parseGpxFile(rawPath);
    const rows = computePointMetrics(rawPoints, windowDistance);

    const valid = rows.filter(
      (r) =>
        r.slope_pct != null &&
        r.speed_km_h != null &&
        isFinite(r.slope_pct) &&
        isFinite(r.speed_km_h!) &&
        r.speed_km_h! < 25
    );

    if (!valid.length) {
      console.error("No valid points to generate the chart.");
      return;
    }

    await generateVisualization(valid, windowDistance);
  } catch (err: any) {
    console.error("Could not read the file.", err);
    if (err?.code === "ENOENT") {
      console.error(`File not found: ${rawPath}`);
    } else {
      console.error("Error: ", err.message || err);
    }
    process.exitCode = 1;
  }
}

main();
