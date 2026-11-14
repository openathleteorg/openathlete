import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import { useMemo } from 'react';

export type PickedAthlete = { athleteId: number; userId: number; name: string };

/** The athletes the user coaches, by name, with their user id */
export function useCoachedAthletes(excludeAthleteId?: number | null) {
  const { data: coached } = useGetMyCoachedAthletesQuery();
  return useMemo<PickedAthlete[]>(
    () =>
      (coached ?? [])
        .filter(
          (athlete) =>
            athlete.athleteId !== excludeAthleteId && athlete.user?.userId,
        )
        .map((athlete) => ({
          athleteId: athlete.athleteId,
          userId: athlete.user!.userId,
          name: `${athlete.user?.firstName ?? ''} ${athlete.user?.lastName ?? ''}`.trim(),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [coached, excludeAthleteId],
  );
}
