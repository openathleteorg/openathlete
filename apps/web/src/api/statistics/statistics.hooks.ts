import { QueryOptions, useQuery } from '@tanstack/react-query';

import { StatisticsAPI } from './statistics.api';
import { statisticsKeys } from './statistics.keys';

export const useGetStatisticsForPeriodQuery = (
  athleteId: number,
  startDate: Date,
  endDate: Date,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof StatisticsAPI.getStatisticsForPeriod>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () =>
      StatisticsAPI.getStatisticsForPeriod(athleteId, startDate, endDate),
    queryKey: [
      statisticsKeys.getStatisticsForPeriod,
      athleteId,
      startDate,
      endDate,
    ],
  });
