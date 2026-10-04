import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { compressActivityStream } from '../../../helpers/activity-stream';
import { WeatherService } from '../../weather/weather.service';
import { ActivityPipelineContext } from '../types';
import { WeatherProcessor } from './weather.processor';

test('weather sampling skips GPS gaps instead of requesting made-up positions', async () => {
  const prisma = {
    eventActivity: {
      findUnique: jest.fn().mockResolvedValue({
        eventActivityId: 1,
        event: { startDate: new Date('2020-01-01') },
        stream: compressActivityStream({
          time: [0, 10, 20],
          distance: [0, 500, 1000],
          latlng: [[], [40, 1], []],
        }),
      }),
    },
    eventActivityWeather: { upsert: jest.fn() },
  };
  const weather = {
    fetch: jest.fn().mockResolvedValue([]),
    providerName: 'test',
  };
  await new WeatherProcessor(
    prisma as unknown as PrismaService,
    weather as unknown as WeatherService,
  ).run({ eventActivityId: 1, bulkImport: false } as ActivityPipelineContext);
  expect(weather.fetch.mock.calls[0][0].points).toEqual([
    { lat: 40, lon: 1, distM: 500, timeSec: 10 },
  ]);
});
