import { GpxPoint } from "./gpx";

export function stravaPolynomial(x: number): number {
  return (
    0.990554879163107 +
    0.032844586542411 * x +
    0.002148347700774 * Math.pow(x, 2) -
    0.000004498739573 * Math.pow(x, 3) -
    0.000000598866801 * Math.pow(x, 4)
  );
}

export function haversineDistance(p1: GpxPoint, p2: GpxPoint): number {
  const R = 6371000; // radius of Earth in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatHms(sec: number): string {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatMPerKm(minPerKm: number): string {
  const totalSeconds = Math.round(minPerKm * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = minutes.toString();
  const ss = seconds.toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
