import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { CoachDashboardResponseDto } from '@openathlete/shared';

import { CoachAPI } from './coach.api';
import { coachKeys } from './coach.keys';

export function useCoachDashboardQuery(
  start?: Date,
  end?: Date,
  options?: UseQueryOptions<CoachDashboardResponseDto>,
) {
  const startIso = start?.toISOString();
  const endIso = end?.toISOString();
  return useQuery<CoachDashboardResponseDto>({
    queryKey: coachKeys.dashboard(startIso, endIso),
    queryFn: () => CoachAPI.getDashboard(start, end),
    staleTime: 60 * 1000,
    ...options,
  });
}


