import { parseGPXWithCustomParser, Point, Track } from "@we-gold/gpxjs";
import { DOMParser } from "xmldom-qsa";
import { promises as fs } from "fs";
import path from "path";

export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: Date | null;
  hr: number | null;
}

export interface GpxTrack {
  name?: string;
  type?: string | null;
  points: GpxPoint[];
}

export interface ParsedGpx {
  file: string;
  metadata?: {
    time?: Date | null;
    name?: string | null;
  };
  tracks: GpxTrack[];
}

export async function parseGpx(filePath: string): Promise<ParsedGpx> {
  const base = process.env.INIT_CWD || process.cwd();
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(base, filePath);
  const raw = await fs.readFile(resolved, "utf8");

  const [parsed, error] = parseGPXWithCustomParser(raw, (txt: string) => {
    const doc = new DOMParser().parseFromString(txt, "text/xml");
    return doc;
  });
  if (error || !parsed) throw error || new Error("GPX parse failed");

  const tracks: GpxTrack[] = (parsed.tracks || []).map((t: Track) => ({
    name: t.name || undefined,
    type: t.type ?? null,
    points: (t.points || []).map((pt: any) => ({
      lat: pt.latitude,
      lon: pt.longitude,
      ele: (pt.elevation ?? null) as number | null,
      time: pt.time ? new Date(pt.time) : null,
      hr: pt.extensions?.["gpxtpx:TrackPointExtension"]
        ? Number(pt.extensions["gpxtpx:TrackPointExtension"]["gpxtpx:hr"]) ||
          null
        : null,
    })),
  }));

  return {
    file: resolved,
    metadata: {
      time: parsed.metadata?.time ? new Date(parsed.metadata.time) : null,
      name: parsed.metadata?.name ?? null,
    },
    tracks,
  } as ParsedGpx;
}
