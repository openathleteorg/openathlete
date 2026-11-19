import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { useYearReviewQuery } from '@/api/year-review';
import { useSpaceContext } from '@/contexts/space';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  User,
  YEAR_REVIEW_MIN_ACTIVITIES,
  isYearReviewSeen,
  yearReviewYear,
} from '@openathlete/shared';

/**
 * The year whose review the app offers today. A development build can open
 * the current year's outside the window (`VITE_YEAR_REVIEW_PREVIEW=true`).
 */
export function offeredYearReviewYear(now = new Date()): number | null {
  const year = yearReviewYear(now);
  if (year !== null) return year;
  return import.meta.env.VITE_YEAR_REVIEW_PREVIEW === 'true'
    ? now.getFullYear()
    : null;
}

/**
 * Whether the athlete gets a year review right now, and whether they have
 * opened it: from 10 December to 2 January, in their own space, after a
 * year with enough activities to tell a story.
 */
export function useYearReview() {
  const { space } = useSpaceContext();
  const { data: athlete } = useGetMyAthleteQuery();
  const { data: me } = useGetMeQuery();
  const { mutate: updateAccount } = useUpdateAccountMutation();
  const queryClient = useQueryClient();

  const year = space === 'ATHLETE' ? offeredYearReviewYear() : null;
  const { data: review } = useYearReviewQuery(athlete?.athleteId, year);
  const available =
    year !== null &&
    review !== undefined &&
    review.totals.activities >= YEAR_REVIEW_MIN_ACTIVITIES;

  const markSeen = useCallback(() => {
    if (year === null || isYearReviewSeen(me?.yearReviewSeenAt, year)) return;
    queryClient.setQueryData<User>([userKeys.getMe], (old) =>
      old ? { ...old, yearReviewSeenAt: new Date() } : old,
    );
    updateAccount({ yearReviewSeen: true });
  }, [me?.yearReviewSeenAt, queryClient, updateAccount, year]);

  return {
    available,
    year,
    review: available ? review : undefined,
    seen: year !== null && isYearReviewSeen(me?.yearReviewSeenAt, year),
    markSeen,
  };
}
