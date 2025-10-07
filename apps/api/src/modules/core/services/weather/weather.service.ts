import { Injectable } from '@nestjs/common';

import { OpenMeteoWeatherProvider } from './providers/openmeteo.provider';
import {
  WeatherProvider,
  WeatherQuery,
  WeatherSample,
} from './providers/types';

@Injectable()
export class WeatherService {
  private readonly provider: WeatherProvider;

  constructor(openMeteo: OpenMeteoWeatherProvider) {
    // TODO: later use ConfigService to select provider
    this.provider = openMeteo;
  }

  fetch(q: WeatherQuery): Promise<WeatherSample[]> {
    return this.provider.fetchSamples(q);
  }

  get providerName() {
    return this.provider.name;
  }
}
