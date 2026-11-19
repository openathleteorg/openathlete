import { ReactNode } from 'react';

import { YearReviewDto } from '@openathlete/shared';

import { BestMonthSlide } from './best-month-slide';
import { ConsistencySlide } from './consistency-slide';
import { FitnessSlide } from './fitness-slide';
import { HighlightSlide } from './highlight-slide';
import { IntroSlide } from './intro-slide';
import { PersonaSlide } from './persona-slide';
import { RecapSlide } from './recap-slide';
import { RecordsSlide } from './records-slide';
import { SportsSlide } from './sports-slide';
import { VolumeSlide } from './volume-slide';

type Glow = readonly [string, string, string];

export interface StorySlide {
  id: string;
  /** The three glows behind the slide, from the brand's colours */
  glow: Glow;
  render: (controls: { replay: () => void }) => ReactNode;
}

const SKY = 'var(--yr-sky)';
const ORCHID = 'var(--yr-orchid)';
const CORAL = 'var(--yr-coral)';
const MINT = 'var(--yr-mint)';
const AMBER = 'var(--yr-amber)';
const VIOLET = 'var(--oa-accent-2)';

/**
 * The slides a year has material for, in the order they tell it: a year
 * without a race or a record skips those slides rather than showing zeros.
 */
export function storySlides(review: YearReviewDto): StorySlide[] {
  const monthsWithActivity = review.months.filter(
    (month) => month.movingTime > 0,
  ).length;
  const slides: (StorySlide | false)[] = [
    {
      id: 'intro',
      glow: [SKY, ORCHID, CORAL],
      render: () => <IntroSlide review={review} />,
    },
    {
      id: 'volume',
      glow: [SKY, MINT, VIOLET],
      render: () => <VolumeSlide review={review} />,
    },
    {
      id: 'sports',
      glow: [CORAL, SKY, MINT],
      render: () => <SportsSlide review={review} />,
    },
    {
      id: 'consistency',
      glow: [MINT, SKY, CORAL],
      render: () => <ConsistencySlide review={review} />,
    },
    monthsWithActivity >= 2 && {
      id: 'month',
      glow: [ORCHID, SKY, VIOLET],
      render: () => <BestMonthSlide review={review} />,
    },
    review.fitness !== null && {
      id: 'fitness',
      glow: [MINT, ORCHID, SKY],
      render: () => <FitnessSlide review={review} />,
    },
    review.highlight !== null && {
      id: 'highlight',
      glow: [CORAL, ORCHID, SKY],
      render: () => <HighlightSlide review={review} />,
    },
    review.records.highlights.length > 0 && {
      id: 'records',
      glow: [MINT, SKY, CORAL],
      render: () => <RecordsSlide review={review} />,
    },
    {
      id: 'persona',
      glow: [CORAL, AMBER, ORCHID],
      render: () => <PersonaSlide review={review} />,
    },
    {
      id: 'recap',
      glow: [SKY, ORCHID, CORAL],
      render: ({ replay }) => <RecapSlide review={review} onReplay={replay} />,
    },
  ];
  return slides.filter((slide): slide is StorySlide => Boolean(slide));
}
