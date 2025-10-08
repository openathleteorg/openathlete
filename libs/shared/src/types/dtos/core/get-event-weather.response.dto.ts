export interface EventWeatherSampleDto {
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
}

export interface GetEventWeatherResponseDto {
  resolutionM: number;
  provider?: string | null;
  samples: EventWeatherSampleDto[];
}
