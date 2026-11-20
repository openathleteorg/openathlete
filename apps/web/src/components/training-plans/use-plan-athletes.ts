import {
  useGetMyAthleteQuery,
  useGetMyCoachedAthletesQuery,
} from '@/api/athlete';
import { useSpaceContext } from '@/contexts/space';

import { athleteName } from './plan-format';

export interface PlanAthlete {
  athleteId: number;
  name: string;
}

/**
 * Whose calendar a plan can go on or come from: the coached athletes in the
 * coach space, the user's own otherwise.
 */
export function usePlanAthletes(): PlanAthlete[] {
  const { space } = useSpaceContext();
  const { data: me } = useGetMyAthleteQuery();
  const { data: coached = [] } = useGetMyCoachedAthletesQuery();
  const athletes = space === 'COACH' ? coached : me ? [me] : [];
  return athletes.map((athlete) => ({
    athleteId: athlete.athleteId,
    name: athleteName(athlete),
  }));
}
