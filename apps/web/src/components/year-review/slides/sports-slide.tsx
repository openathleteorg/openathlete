import { sportIconSrc } from '@/components/sport-icon/sport-icon-src';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { CSSProperties } from 'react';

import { formatNumber, formatPercent, hours, kilometers } from '../format';
import { after } from '../story/after';
import { Eyebrow, Slide, Title } from '../story/slide';
import { SERIES_COLORS, SlideProps } from './types';

const SHOWN = 4;

export function SportsSlide({ review }: SlideProps) {
  const shown = review.sports.slice(0, SHOWN);
  const [main] = shown;
  const longest = main.movingTime;
  const totalTime = review.totals.movingTime;
  const several = review.sports.length > 1;

  return (
    <Slide>
      <Eyebrow>{m.year_review_sports_eyebrow()}</Eyebrow>
      <Title
        accent={
          several
            ? m.year_review_sports_title_many_accent({
                count: review.sports.length,
              })
            : m.year_review_sports_title_one_accent()
        }
      >
        {several
          ? m.year_review_sports_title_many()
          : m.year_review_sports_title_one()}
      </Title>
      <ul className="yr-sports">
        {shown.map((sport, index) => (
          <li
            key={sport.sport}
            className="yr-sport yr-reveal"
            style={
              {
                ...after(300 + index * 120),
                '--c': SERIES_COLORS[index],
                '--w': `${(sport.movingTime / longest) * 100}%`,
              } as CSSProperties
            }
          >
            <span className="yr-badge">
              <i
                className="yr-sport-icon"
                style={
                  {
                    '--icon': `url("${sportIconSrc(sport.sport)}")`,
                  } as CSSProperties
                }
              />
            </span>
            <span>
              <span className="yr-sport-name">
                {sportTypeLabelMap[sport.sport]}
              </span>
              <span className="yr-sport-meta">
                {[
                  sport.distance >= 1000 &&
                    `${formatNumber(kilometers(sport.distance))} km`,
                  sport.count === 1
                    ? m.year_review_one_session()
                    : m.year_review_sessions_count({ count: sport.count }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <span className="yr-sport-value">
              {formatNumber(hours(sport.movingTime))}
              <small> h</small>
            </span>
            <span className="yr-track">
              <b />
            </span>
          </li>
        ))}
      </ul>
      <p className="yr-callout yr-push yr-reveal" style={after(1000)}>
        {m.year_review_sports_share({
          sport: sportTypeLabelMap[main.sport],
          share: formatPercent(main.movingTime / totalTime),
        })}
      </p>
    </Slide>
  );
}
