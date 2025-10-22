import {
  useGetMyAthleteQuery,
  useGetMyCoachedAthletesQuery,
} from '@/api/athlete';

interface UseAthleteInfoParams {
  athleteId?: number;
}

export function useAthleteInfo({ athleteId }: UseAthleteInfoParams) {
  const { data: myAthlete } = useGetMyAthleteQuery();
  const { data: coachedAthletes } = useGetMyCoachedAthletesQuery();

  // If no athleteId is provided, return the current user's athlete info
  if (!athleteId) {
    return {
      athlete: myAthlete,
      isCurrentUser: true,
    };
  }

  // If athleteId is the same as the current user's athlete, return current user info
  if (myAthlete && myAthlete.athleteId === athleteId) {
    return {
      athlete: myAthlete,
      isCurrentUser: true,
    };
  }

  // Otherwise, find the athlete in the coached athletes list
  const athlete = coachedAthletes?.find((a) => a.athleteId === athleteId);

  return {
    athlete,
    isCurrentUser: false,
  };
}
