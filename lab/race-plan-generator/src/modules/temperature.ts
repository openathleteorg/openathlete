import * as SunCalc from "suncalc";

export interface TemperatureModelConfig {
  baseDayTempC?: number; // peak daytime temperature around 15:00
  diurnalAmplitudeC?: number; // swing +/- around base
  nightDropPct?: number; // additional percentage drop at night (0.0..0.5)
  lapseRateCPer100m?: number; // decrease per 100 m altitude (default 0.6 C/100m)
  sampleIntervalMin?: number; // temporal resolution for fake data (default 60 min)
}

export type TemperatureAt = (params: {
  date: Date;
  lat: number;
  lon: number;
  altitudeM?: number;
}) => number;

export function createTemperatureModel(
  cfg: TemperatureModelConfig = {}
): TemperatureAt {
  const baseDay = cfg.baseDayTempC ?? 27;
  const amp = cfg.diurnalAmplitudeC ?? 6;
  const nightDrop = Math.max(0, Math.min(0.5, cfg.nightDropPct ?? 0.2));
  const lapsePer100 = cfg.lapseRateCPer100m ?? 0.6;

  // Returns degrees Celsius at given time/location/altitude with a simple diurnal cycle
  return ({
    date,
    lat,
    lon,
    altitudeM,
  }: {
    date: Date;
    lat: number;
    lon: number;
    altitudeM?: number;
  }) => {
    const local = date;
    const hour = local.getHours() + local.getMinutes() / 60;
    // peak at ~15:00 local time
    const phase = 2 * Math.PI * ((hour - 15) / 24);
    let temp = baseDay + amp * Math.sin(phase);
    const times = SunCalc.getTimes(local, lat, lon);
    const isNight =
      local < (times.sunrise as Date) || local > (times.sunset as Date);
    if (isNight) {
      temp = temp * (1 - nightDrop);
    }
    if (Number.isFinite(altitudeM)) {
      const alt = Math.max(0, altitudeM || 0);
      temp -= (alt / 100) * lapsePer100;
    }
    return temp;
  };
}

export function tempSlowMultiplier(tempC: number): number {
  // Speed penalty due to temperature; returns time multiplier (>1 slower)
  // Baseline comfortable range ~10C
  const base = 13;
  if (!Number.isFinite(tempC)) return 1;
  if (tempC > base) {
    const kHot = 0.005; // +0.5% time per +1C above base
    return 1 + kHot * (tempC - base);
  }
  if (tempC < 0) {
    const kCold = 0.002; // +0.2% time per -1C below 0
    return 1 + kCold * (0 - tempC);
  }
  return 1;
}

export function sweatTempFactor(tempC: number): number {
  // Multiplicative factor for sweat rate based on temp; 1.0 at 10C; 1.2 at 20C; 1.4 at 30C; 0.8 at 0C
  const base = 10;
  if (!Number.isFinite(tempC)) return 1;
  const delta = tempC - base;
  const up = 1 + 0.02 * Math.max(0, delta); // +2% per +1C
  const down = 1 - 0.02 * Math.max(0, -delta); // -2% per -1C
  const f = delta >= 0 ? up : down;
  return Math.max(0.6, Math.min(1.6, f));
}
