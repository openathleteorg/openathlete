import { QueryOptions, useQuery } from '@tanstack/react-query';

import { SPORT_TYPE } from '@openathlete/shared';

import { ProgressionAPI } from './progression.api';
import { progressionKeys } from './progression.keys';

export const useGetFirstActivityDateQuery = (
  athleteId: number,
  sport?: SPORT_TYPE,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof ProgressionAPI.getFirstActivityDate>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => ProgressionAPI.getFirstActivityDate(athleteId, sport),
    queryKey: [progressionKeys.getFirstActivityDate, athleteId, sport],
  });

export const useGetProgressionDataQuery = (
  athleteId: number,
  startDate: Date,
  endDate: Date,
  sport?: SPORT_TYPE,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof ProgressionAPI.getProgressionData>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () =>
      ProgressionAPI.getProgressionData(athleteId, startDate, endDate, sport),
    queryKey: [
      progressionKeys.getProgressionData,
      athleteId,
      startDate,
      endDate,
      sport,
    ],
  });
