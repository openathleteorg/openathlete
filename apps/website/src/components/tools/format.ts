/** Seconds from "h:mm:ss", "mm:ss" or "ss". */
export function parseDuration(value: string): number {
  const parts = value
    .trim()
    .split(':')
    .map((part) => Number(part || 0));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

/** 3725 → "1:02:05", 305 → "5:05". */
export function formatDuration(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  return `${minutes}:${ss}`;
}

/** Pace in min/km from a speed in km/h. */
export function paceFromSpeed(kmh: number): string {
  return kmh > 0 ? formatDuration(3600 / kmh) : '–';
}

export function formatNumber(value: number, locale: string, digits = 1) {
  return value.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const RACE_DISTANCES = [
  { id: '5k', km: 5 },
  { id: '10k', km: 10 },
  { id: 'half', km: 21.0975 },
  { id: 'marathon', km: 42.195 },
] as const;

export type RaceId = (typeof RACE_DISTANCES)[number]['id'];
