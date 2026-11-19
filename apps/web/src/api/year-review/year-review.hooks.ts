import { useQuery } from '@tanstack/react-query';

import { YearReviewAPI } from './year-review.api';
import { yearReviewKeys } from './year-review.keys';

/** A year changes little within an hour: the review is read once */
const STALE_TIME = 60 * 60_000;

export const useYearReviewQuery = (
  athleteId: number | undefined,
  year: number | null,
) =>
  useQuery({
    queryFn: () => YearReviewAPI.get(athleteId!, year!),
    queryKey: [yearReviewKeys.get, athleteId, year],
    enabled: athleteId !== undefined && year !== null,
    staleTime: STALE_TIME,
  });
