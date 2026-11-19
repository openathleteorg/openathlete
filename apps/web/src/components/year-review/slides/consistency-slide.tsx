import { m } from '@/paraglide/messages';
import { CSSProperties, useMemo } from 'react';

import { formatDayMonth, formatNumber } from '../format';
import { after } from '../story/after';
import { CountUp } from '../story/count-up';
import { Eyebrow, Slide, Stat, Title } from '../story/slide';
import { SlideProps } from './types';

const DAY_MS = 24 * 3600 * 1000;

/** Index of today in the year, or past its end for a year that is over */
function todayIndex(year: number) {
  const now = new Date();
  if (now.getFullYear() !== year) return Infinity;
  return Math.floor(
    (Date.UTC(year, now.getMonth(), now.getDate()) - Date.UTC(year, 0, 1)) /
      DAY_MS,
  );
}

export function ConsistencySlide({ review }: SlideProps) {
  const { days, longestStreak, totals, year } = review;
  const today = todayIndex(year);
  const streak = useMemo(() => {
    if (!longestStreak) return null;
    const start = Date.parse(`${longestStreak.start}T00:00:00Z`);
    const first = (start - Date.UTC(year, 0, 1)) / DAY_MS;
    return [first, first + longestStreak.days - 1];
  }, [longestStreak, year]);
  const weeks = Math.max(1, Math.min(days.length, today + 1) / 7);
  const integer = (value: number) => formatNumber(Math.round(value));

  return (
    <Slide>
      <Eyebrow>{m.year_review_consistency_eyebrow()}</Eyebrow>
      <Title accent={m.year_review_consistency_accent()}>
        {m.year_review_consistency_title({
          days: formatNumber(totals.activeDays),
        })}
      </Title>
      <div
        className="yr-heat"
        role="img"
        aria-label={m.year_review_heat_label()}
      >
        {days.map((level, index) => (
          <i
            key={index}
            data-level={level}
            data-streak={
              streak && index >= streak[0] && index <= streak[1]
                ? ''
                : undefined
            }
            data-future={index > today ? '' : undefined}
            style={{ '--i': index } as CSSProperties}
          />
        ))}
      </div>
      <div className="yr-legend yr-reveal" style={after(400)}>
        <span>
          {formatDayMonth(`${year}-01-01`)} → {formatDayMonth(`${year}-12-31`)}
        </span>
        <span className="yr-legend-scale">
          {m.year_review_rest()}
          <i />
          <i />
          <i />
          <i />
          {m.year_review_intense()}
        </span>
      </div>
      <div
        className="yr-stats yr-push"
        style={{ '--columns': 2 } as CSSProperties}
      >
        {streak && longestStreak && longestStreak.days > 1 && (
          <Stat
            delay={600}
            tone="coral"
            value={<CountUp value={longestStreak.days} format={integer} />}
            label={m.year_review_streak({
              start: formatDayMonth(longestStreak.start),
              end: formatDayMonth(longestStreak.end),
            })}
          />
        )}
        <Stat
          delay={750}
          value={formatNumber(totals.activities / weeks, 1)}
          label={m.year_review_per_week()}
        />
      </div>
    </Slide>
  );
}
