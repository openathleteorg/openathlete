export type WeatherSample = {
  distM: number;
  timeSec: number;
  lat: number;
  lon: number;
  temperatureC?: number;
  apparentTemperatureC?: number;
  humidityPct?: number;
  precipitationMm?: number;
  rainMm?: number;
  snowfallCm?: number;
  cloudCoverPct?: number;
  windSpeed10mKmh?: number;
  windGusts10mKmh?: number;
  shortwaveRadiationWm2?: number;
  sunshineDurationSec?: number;
  isDay?: boolean;
};

export type WeatherQuery = {
  // activity context
  startDate: Date;
  points: { lat: number; lon: number; distM: number; timeSec: number }[];
};

export interface WeatherProvider {
  name: string;
  // Returns weather samples aligned to provided points (same order/length)
  fetchSamples(q: WeatherQuery): Promise<WeatherSample[]>;
}
