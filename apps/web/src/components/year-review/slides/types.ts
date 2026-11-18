import { YearReviewDto } from '@openathlete/shared';

export interface SlideProps {
  review: YearReviewDto;
}

/** The four colours of the logo, given to series in this order */
export const SERIES_COLORS = [
  'var(--yr-sky)',
  'var(--yr-coral)',
  'var(--yr-mint)',
  'var(--yr-orchid)',
] as const;
