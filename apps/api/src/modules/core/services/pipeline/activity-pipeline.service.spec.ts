import { ActivityPipelineService } from './activity-pipeline.service';
import { ActivityPipelineContext, ActivityProcessor } from './types';

test('a failing processor does not stop the ones after it', async () => {
  const weather = {
    name: 'weather',
    run: jest.fn().mockRejectedValue(new Error('Open-Meteo timed out')),
  };
  const next = { name: 'next', run: jest.fn().mockResolvedValue(undefined) };
  await new ActivityPipelineService([
    weather,
    next,
  ] as unknown as ActivityProcessor[]).run({
    eventActivityId: 1,
  } as ActivityPipelineContext);
  expect(next.run).toHaveBeenCalled();
});
