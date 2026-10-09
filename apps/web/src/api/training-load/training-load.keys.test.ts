import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { eventKeys } from '../event/event.keys';
import {
  invalidateTrainingLoadQueries,
  trainingLoadKeys,
} from './training-load.keys';

describe('invalidateTrainingLoadQueries', () => {
  it('refetches every training load query, and only those', async () => {
    const queryClient = new QueryClient();
    const weekly = [trainingLoadKeys.getWeeklyLoadSummary, '2026-10-05', 12];
    const metrics = [trainingLoadKeys.getTrainingLoadMetrics, 12];
    const events = [eventKeys.getMyEvents];
    for (const key of [weekly, metrics, events]) {
      queryClient.setQueryData(key, []);
    }

    await invalidateTrainingLoadQueries(queryClient);

    const invalidated = (key: unknown[]) =>
      queryClient.getQueryState(key)?.isInvalidated;
    expect(invalidated(weekly)).toBe(true);
    expect(invalidated(metrics)).toBe(true);
    expect(invalidated(events)).toBe(false);
  });
});
