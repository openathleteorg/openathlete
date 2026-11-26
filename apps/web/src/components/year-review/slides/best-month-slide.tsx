import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { CSSProperties } from 'react';

import { formatNumber, hours, monthName } from '../format';
import { after } from '../story/after';
import { Eyebrow, Slide, Title } from '../story/slide';
import { SlideProps } from './types';

/** The month with the most time in motion: fair to every sport */
function bestMonthIndex(months: SlideProps['review']['months']) {
  return months.reduce(
    (best, month, index) =>
      month.movingTime > months[best].movingTime ? index : best,
    0,
  );
}

export function BestMonthSlide({ review }: SlideProps) {
  const units = useUnits();
  const { months } = review;
  const best = bestMonthIndex(months);
  const longest = months[best].movingTime;
  const name = monthName(best);

  return (
    <Slide>
      <Eyebrow>{m.year_review_month_eyebrow()}</Eyebrow>
      <Title accent={m.year_review_month_accent()}>
        {m.year_review_month_title({
          month: name.charAt(0).toUpperCase() + name.slice(1),
        })}
      </Title>
      <p className="yr-lead yr-reveal" style={after(250)}>
        {m.year_review_month_lead({
          distance: `${formatNumber(Math.round(units.distanceValue(months[best].distance)))} ${units.distanceLabel}`,
          hours: formatNumber(hours(months[best].movingTime)),
        })}
      </p>
      <div className="yr-push">
        <div
          className="yr-columns"
          style={{ '--count': 12 } as CSSProperties}
          aria-hidden
        >
          {months.map((month, index) => (
            <div
              key={index}
              className="yr-column"
              data-best={index === best ? '' : undefined}
              style={
                {
                  '--i': index,
                  '--h': `${(month.movingTime / longest) * 88}%`,
                } as CSSProperties
              }
            >
              {index === best && (
                <em className="yr-column-label">
                  {formatNumber(hours(month.movingTime))} h
                </em>
              )}
            </div>
          ))}
        </div>
        <div className="yr-axis" style={{ '--count': 12 } as CSSProperties}>
          {months.map((_, index) => (
            <span key={index} data-best={index === best ? '' : undefined}>
              {monthName(index, 'narrow')}
            </span>
          ))}
        </div>
      </div>
    </Slide>
  );
}
