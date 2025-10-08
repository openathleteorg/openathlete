import { m } from '@/paraglide/messages';

import type {
  ActivityStream,
  GetEventWeatherResponseDto,
} from '@openathlete/shared';

import { WeatherCloudCoverChart } from '../../charts/weather-cloud-cover-chart';
import { WeatherHumidityChart } from '../../charts/weather-humidity-chart';
import { WeatherPrecipitationChart } from '../../charts/weather-precipitation-chart';
import { WeatherRadiationChart } from '../../charts/weather-radiation-chart';
import { WeatherTemperatureChart } from '../../charts/weather-temperature-chart';
import { WeatherWindChart } from '../../charts/weather-wind-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface P {
  data?: GetEventWeatherResponseDto;
  stream?: ActivityStream;
}

export function ActivityDetailsWeatherTab({ data, stream }: P) {
  const samples = data?.samples ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.weather()}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <WeatherTemperatureChart
          samples={samples}
          deviceDistance={stream?.distance}
          deviceTemp={stream?.temp}
        />
        <WeatherHumidityChart samples={samples} />
        <WeatherWindChart samples={samples} />
        <WeatherPrecipitationChart samples={samples} />
        <WeatherCloudCoverChart samples={samples} />
        <WeatherRadiationChart samples={samples} />
      </CardContent>
    </Card>
  );
}
