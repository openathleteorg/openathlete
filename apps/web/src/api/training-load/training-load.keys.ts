import { QueryClient } from '@tanstack/react-query';

export const trainingLoadKeys = {
  root: 'TrainingLoadAPI',
  calculateActivityLoad: 'TrainingLoadAPI.calculateActivityLoad',
  getActivityTrainingLoads: 'TrainingLoadAPI.getActivityTrainingLoads',
  getTrainingLoadByPeriod: 'TrainingLoadAPI.getTrainingLoadByPeriod',
  getTrainingLoadMetrics: 'TrainingLoadAPI.getTrainingLoadMetrics',
  getTrainingLoadHistory: 'TrainingLoadAPI.getTrainingLoadHistory',
  getWeeklyLoadSummary: 'TrainingLoadAPI.getWeeklyLoadSummary',
  getDailyForm: 'TrainingLoadAPI.getDailyForm',
  recalculateAllLoads: 'TrainingLoadAPI.recalculateAllLoads',
} as const;

/**
 * Refetches every training load query. Keys start with a method name
 * (`TrainingLoadAPI.getWeeklyLoadSummary`), so a `[root]` prefix matches none:
 * compare the first element instead. Call it whenever planned or done
 * sessions change, as the weekly load and the projected form depend on them.
 */
export const invalidateTrainingLoadQueries = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({
    predicate: ({ queryKey: [key] }) =>
      typeof key === 'string' && key.startsWith(trainingLoadKeys.root),
  });
