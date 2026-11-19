import { createContext, useContext } from 'react';

import { useYearReview } from './use-year-review';

export type YearReviewContextValue = ReturnType<typeof useYearReview> & {
  /** Opens the story from this element, or from the middle of the screen */
  open: (from?: Element | null) => void;
};

export const YearReviewContext = createContext<YearReviewContextValue | null>(
  null,
);

export function useYearReviewContext() {
  const context = useContext(YearReviewContext);
  if (!context) {
    throw new Error('useYearReviewContext needs a YearReviewProvider');
  }
  return context;
}
