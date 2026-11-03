/**
 * Builds routes.json: real paths around Annecy with their elevation, used by
 * seed.ts to draw GPS tracks and elevation profiles that look recorded.
 *
 * Run once (it calls public services, so the seed itself stays offline):
 *   pnpm --filter @openathlete/database exec tsx ../../scripts/screenshots/build-routes.ts [ids...]
 *
 * Paths: FOSSGIS OSRM (routing.openstreetmap.de, foot and bike profiles).
 * Elevation: OpenTopoData EU-DEM 25 m.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type LatLng = [number, number];
type Profile = 'foot' | 'bike';

interface RouteSpec {
  id: string;
  profile: Profile;
  /** Waypoints, [lat, lng] */
  via: LatLng[];
}

export interface RouteData {
  id: string;
  /** Points about every 25 m: [lat, lng, altitude m, cumulative distance m] */
  points: [number, number, number, number][];
  distance: number;
}

const PAQUIER: LatLng = [45.901, 6.1305];
const MARQUISATS: LatLng = [45.888, 6.1375];

const SPECS: RouteSpec[] = [
  // Easy run on the lakeside greenway to Sevrier and back (the bike profile
  // keeps to the shore; the foot one climbs the hillside)
  {
    id: 'lake-sevrier',
    profile: 'bike',
    via: [PAQUIER, MARQUISATS, [45.8645, 6.1432], MARQUISATS, PAQUIER],
  },
  // Short loop through Annecy-le-Vieux and the Albigny shore
  {
    id: 'albigny-loop',
    profile: 'foot',
    via: [PAQUIER, [45.9068, 6.1556], [45.9198, 6.1433], [45.9105, 6.1268], PAQUIER],
  },
  // Long run on the lakeside cycle path to Saint-Jorioz and back
  {
    id: 'lake-saint-jorioz',
    profile: 'bike',
    via: [PAQUIER, MARQUISATS, [45.8312, 6.1638], MARQUISATS, PAQUIER],
  },
  // Flat interval loop around the Pâquier and the Marquisats
  {
    id: 'paquier-loop',
    profile: 'bike',
    via: [PAQUIER, MARQUISATS, PAQUIER],
  },
  // Trail: Vieil Annecy up to the Crêt du Maure forest and back
  {
    id: 'cret-du-maure',
    profile: 'foot',
    via: [[45.8987, 6.1238], [45.8785, 6.1182], [45.8668, 6.1153], [45.8987, 6.1238]],
  },
  // Trail: Veyrier-du-Lac, Mont Baron, Mont Veyrier
  {
    id: 'mont-veyrier',
    profile: 'foot',
    via: [[45.8838, 6.1748], [45.8978, 6.1852], [45.9096, 6.1823], [45.8838, 6.1748]],
  },
  // Trail: Col de la Forclaz to La Tournette and back
  {
    id: 'tournette',
    profile: 'foot',
    via: [[45.8167, 6.2478], [45.8318, 6.2829], [45.8167, 6.2478]],
  },
  // Trail: Semnoz ridge from Quintal
  {
    id: 'semnoz',
    profile: 'foot',
    via: [[45.8335, 6.0903], [45.7952, 6.1052], [45.8335, 6.0903]],
  },
  // Ride: the full lake tour
  {
    id: 'tour-du-lac',
    profile: 'bike',
    via: [PAQUIER, [45.8645, 6.1432], [45.8285, 6.1985], [45.7716, 6.2167], [45.8402, 6.2147], [45.8848, 6.1745], PAQUIER],
  },
  // Ride: lake shore and the Col de la Forclaz climb
  {
    id: 'col-de-la-forclaz',
    profile: 'bike',
    via: [PAQUIER, [45.8848, 6.1745], [45.8402, 6.2147], [45.8167, 6.2478], [45.8402, 6.2147], [45.8848, 6.1745], PAQUIER],
  },
];

const SAMPLE_M = 25;

async function fetchJson<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()) as T;
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw new Error(`Request failed: ${url}`);
}

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Resamples a polyline to one point every `step` metres. */
function resample(line: LatLng[], step: number): { pts: LatLng[]; dist: number[] } {
  const pts: LatLng[] = [line[0]];
  const dist: number[] = [0];
  let total = 0;
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const seg = haversine(a, b);
    let pos = step - carry;
    while (pos <= seg) {
      const t = pos / seg;
      pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      dist.push(total + pos);
      pos += step;
    }
    carry = seg - (pos - step);
    total += seg;
  }
  pts.push(line[line.length - 1]);
  dist.push(total);
  return { pts, dist };
}

async function elevations(pts: LatLng[]): Promise<number[]> {
  const out: number[] = [];
  for (let i = 0; i < pts.length; i += 100) {
    const batch = pts.slice(i, i + 100);
    const locations = batch.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|');
    const res = await fetchJson<{ results: { elevation: number | null }[] }>(
      `https://api.opentopodata.org/v1/eudem25m?locations=${locations}`,
    );
    out.push(...res.results.map((r) => r.elevation ?? out[out.length - 1] ?? 450));
    // Public instance: 1 request per second
    await new Promise((r) => setTimeout(r, 1100));
  }
  return out;
}

async function build(spec: RouteSpec): Promise<RouteData> {
  const coords = spec.via.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const res = await fetchJson<{ routes: { geometry: { coordinates: [number, number][] } }[] }>(
    `https://routing.openstreetmap.de/routed-${spec.profile}/route/v1/driving/${coords}?overview=full&geometries=geojson`,
  );
  const line = res.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
  const { pts, dist } = resample(line, SAMPLE_M);
  const alt = await elevations(pts);
  return {
    id: spec.id,
    distance: Math.round(dist[dist.length - 1]),
    points: pts.map((p, i) => [
      Number(p[0].toFixed(6)),
      Number(p[1].toFixed(6)),
      Number(alt[i].toFixed(1)),
      Math.round(dist[i]),
    ]),
  };
}

async function main() {
  // Optional ids on the command line rebuild only those routes
  const only = process.argv.slice(2);
  const file = join(__dirname, 'routes.json');
  const routes: RouteData[] =
    only.length && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  for (const spec of SPECS.filter((s) => !only.length || only.includes(s.id))) {
    const route = await build(spec);
    // eslint-disable-next-line no-console
    console.log(`${spec.id}: ${(route.distance / 1000).toFixed(1)} km, ${route.points.length} points`);
    const index = routes.findIndex((r) => r.id === spec.id);
    if (index >= 0) routes[index] = route;
    else routes.push(route);
  }
  writeFileSync(file, JSON.stringify(routes));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
