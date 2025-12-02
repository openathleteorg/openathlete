import { useQuery } from '@tanstack/react-query';

import { InjuryAPI } from './injury.api';

export function useGetInjuriesQuery(athleteId?: number) {
  return useQuery({
    queryKey: ['injuries', athleteId],
    queryFn: () => InjuryAPI.getInjuries(athleteId),
  });
}
