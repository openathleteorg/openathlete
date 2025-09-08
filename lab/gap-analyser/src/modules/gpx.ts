import { parseGPXWithCustomParser } from "@we-gold/gpxjs";
import { DOMParser } from "xmldom-qsa";
import { promises as fs } from "fs";

export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: Date | null;
  hr: number | null;
  // we may add cadence later
}

/**
 * Load and parse a GPX file returning track points. Returns empty array if not running.
 */
export async function loadActivityTrackPoints(
  filePath: string
): Promise<TrackPoint[]> {
  const raw = await fs.readFile(filePath, "utf8");
  const [parsed, error] = parseGPXWithCustomParser(raw, (txt) => {
    const doc = new DOMParser().parseFromString(txt, "text/xml");
    return doc;
  });
  if (error || !parsed) throw error || new Error("GPX parse failed");
  const track = parsed.tracks?.[0];
  if (!track) return [];
  if (track.type && track.type !== "running") return [];
  const pts = track.points.map((pt: any) => ({
    lat: pt.latitude,
    lon: pt.longitude,
    ele: (pt.elevation ?? pt.ele ?? null) as number | null,
    time: pt.time ? new Date(pt.time) : null,
    hr: pt.extensions?.["gpxtpx:TrackPointExtension"]
      ? Number(pt.extensions["gpxtpx:TrackPointExtension"]["gpxtpx:hr"]) || null
      : null,
  }));
  return pts.filter((p) => p.time != null);
}
