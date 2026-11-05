import { SportType } from '@openathlete/database';

/** Weather over the activity, summarized from the samples along the route */
export type WeatherSummary = {
  temperatureC: number;
  feelsLikeC: number | null;
  humidityPct: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  sky: 'clear' | 'partly-cloudy' | 'cloudy' | 'rain' | 'snow';
  isDay: boolean;
};

export type PersonalBest =
  | { kind: 'distance'; distanceM: number; timeSec: number }
  | { kind: 'power'; durationSec: number; watts: number };

/** What the description says, read from the processed activity */
export type ActivityDescriptionFacts = {
  /** Picks among the phrasings, so two activities don't read the same */
  seed: number;
  sport: SportType;
  distanceM: number;
  movingTimeSec: number;
  elevationGainM: number;
  weather: WeatherSummary | null;
  /** Seconds lost to each condition, from the normalization (running) */
  conditionCosts: {
    slopeSec: number;
    temperatureSec: number;
    altitudeSec: number;
  } | null;
  /** Seconds below, between and above the two heart rate thresholds */
  intensitySeconds: [number, number, number] | null;
  decouplingPercent: number | null;
  personalBests: PersonalBest[];
  trimp: number | null;
  kilojoules: number | null;
};

type WeatherSampleLike = {
  temperatureC?: number;
  apparentTemperatureC?: number;
  humidityPct?: number;
  precipitationMm?: number;
  snowfallCm?: number;
  cloudCoverPct?: number;
  windSpeed10mKmh?: number;
  windGusts10mKmh?: number;
  isDay?: boolean;
};

const mean = (values: (number | undefined)[]): number | null => {
  const finite = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  return finite.length
    ? finite.reduce((sum, v) => sum + v, 0) / finite.length
    : null;
};

const max = (values: (number | undefined)[]): number | null => {
  const finite = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  return finite.length ? Math.max(...finite) : null;
};

export function summarizeWeather(samples: unknown): WeatherSummary | null {
  if (!Array.isArray(samples) || samples.length === 0) return null;
  const list = samples as WeatherSampleLike[];
  const temperatureC = mean(list.map((s) => s.temperatureC));
  if (temperatureC === null) return null;

  // Hourly amounts: any wet hour along the route makes it a wet outing
  const snow = max(list.map((s) => s.snowfallCm)) ?? 0;
  const precipitation = max(list.map((s) => s.precipitationMm)) ?? 0;
  const cloud = mean(list.map((s) => s.cloudCoverPct));
  const sky: WeatherSummary['sky'] =
    snow > 0.05
      ? 'snow'
      : precipitation >= 0.3
        ? 'rain'
        : cloud === null || cloud < 30
          ? 'clear'
          : cloud < 75
            ? 'partly-cloudy'
            : 'cloudy';
  const dayVotes = list.filter((s) => s.isDay !== false).length;

  return {
    temperatureC,
    feelsLikeC: mean(list.map((s) => s.apparentTemperatureC)),
    humidityPct: mean(list.map((s) => s.humidityPct)),
    windKmh: mean(list.map((s) => s.windSpeed10mKmh)),
    gustKmh: max(list.map((s) => s.windGusts10mKmh)),
    sky,
    isDay: dayVotes * 2 >= list.length,
  };
}
