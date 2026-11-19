import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { Check } from 'lucide-react';
import { ReactNode } from 'react';

import { SPORT_TYPE } from '@openathlete/shared';

import {
  formatClock,
  formatLongDate,
  formatNumber,
  formatPace,
} from '../format';
import { after } from '../story/after';
import { CountUp } from '../story/count-up';
import { Eyebrow, Slide, Title } from '../story/slide';
import { SlideProps } from './types';

/** Sports read in minutes per kilometre; swims per 100 m, others in km/h */
const PACED = new Set<SPORT_TYPE>([
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.VIRTUAL_RUN,
  SPORT_TYPE.WALK,
  SPORT_TYPE.HIKING,
]);

function speed(
  sport: SPORT_TYPE,
  meters: number,
  seconds: number,
): [ReactNode, string] {
  if (sport === SPORT_TYPE.SWIMMING) {
    return [formatClock(seconds / (meters / 100)), m.year_review_pace_100m()];
  }
  if (PACED.has(sport)) {
    return [formatPace(meters, seconds), m.year_review_pace_km()];
  }
  return [formatNumber(meters / 1000 / (seconds / 3600), 1), 'km/h'];
}

export function HighlightSlide({ review }: SlideProps) {
  const highlight = review.highlight!;
  const isRace = highlight.kind === 'RACE';
  const goalMet =
    isRace &&
    highlight.goalDuration !== null &&
    highlight.duration <= highlight.goalDuration;
  const [pace, paceUnit] = speed(
    highlight.sport,
    highlight.distance,
    highlight.duration,
  );
  const figures: [ReactNode, string][] = [
    [formatNumber(highlight.distance / 1000, 1), 'km'],
    [pace, paceUnit],
    highlight.averageHeartrate
      ? [formatNumber(highlight.averageHeartrate), m.year_review_heartrate()]
      : [formatNumber(highlight.elevationGain), m.year_review_elevation()],
  ];

  return (
    <Slide>
      <Eyebrow>
        {isRace ? m.year_review_race_eyebrow() : m.year_review_outing_eyebrow()}
      </Eyebrow>
      <Title
        accent={
          goalMet
            ? m.year_review_race_goal_accent()
            : isRace
              ? m.year_review_race_accent()
              : m.year_review_outing_accent()
        }
      >
        {goalMet
          ? m.year_review_race_goal_title()
          : isRace
            ? m.year_review_race_title()
            : m.year_review_outing_title()}
      </Title>
      <section className="yr-card yr-reveal" style={after(300)}>
        <svg className="yr-race-trace" viewBox="0 0 200 200" aria-hidden>
          <path
            pathLength={1}
            d="M40 150 C 30 110, 60 100, 70 80 S 60 40, 95 35 S 150 50, 150 80 S 120 110, 140 130 S 175 160, 150 175 S 80 170, 40 150 Z"
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            style={{ stroke: 'var(--yr-coral)' }}
          />
        </svg>
        <span className="yr-tag">
          {goalMet && <Check strokeWidth={3} />}
          {goalMet
            ? m.year_review_race_goal({
                goal: formatClock(highlight.goalDuration!),
              })
            : sportTypeLabelMap[highlight.sport]}
        </span>
        <h3 className="yr-race-name">{highlight.name}</h3>
        <p className="yr-race-date">{formatLongDate(highlight.date)}</p>
        <p className="yr-race-time">
          <CountUp
            value={highlight.duration}
            format={formatClock}
            delay={500}
            duration={2200}
          />
        </p>
        <div className="yr-race-stats">
          {figures.map(([value, unit]) => (
            <p key={unit}>
              <b>{value}</b>
              <span>{unit}</span>
            </p>
          ))}
        </div>
      </section>
    </Slide>
  );
}
