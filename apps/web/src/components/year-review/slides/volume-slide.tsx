import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { Globe2, Mountain } from 'lucide-react';
import { useId } from 'react';

import { formatNumber, formatPercent, hours } from '../format';
import { after } from '../story/after';
import { CountUp } from '../story/count-up';
import { Eyebrow, Slide, Stat, Title } from '../story/slide';
import { SlideProps } from './types';

const EVEREST_METERS = 8849;
const EARTH_CIRCUMFERENCE_METERS = 40_075_000;

export function VolumeSlide({ review }: SlideProps) {
  const units = useUnits();
  const gradient = useId();
  const { distance, movingTime, activities, elevationGain } = review.totals;
  const everests = elevationGain / EVEREST_METERS;
  const earthShare = distance / EARTH_CIRCUMFERENCE_METERS;
  const integer = (value: number) => formatNumber(Math.round(value));

  return (
    <Slide>
      <Eyebrow>{m.year_review_volume_eyebrow()}</Eyebrow>
      <Title>{m.year_review_volume_title()}</Title>
      <div className="yr-mega yr-reveal" style={after(200)}>
        <CountUp value={Math.round(units.distanceValue(distance))} format={integer} />
        <small>{units.distanceLabel}</small>
      </div>
      <div className="yr-stats yr-volume-stats">
        <Stat
          delay={500}
          value={<CountUp value={hours(movingTime)} format={integer} />}
          label={m.year_review_hours()}
        />
        <Stat
          delay={600}
          value={<CountUp value={activities} format={integer} />}
          label={m.year_review_sessions()}
        />
        <Stat
          delay={700}
          value={<CountUp value={units.elevation(elevationGain)} format={integer} />}
          label={
            units.unitSystem === 'IMPERIAL'
              ? units.elevationLabel
              : m.year_review_elevation()
          }
        />
      </div>
      <svg
        className="yr-route yr-reveal"
        style={after(600)}
        viewBox="0 0 300 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradient} x1="0" x2="1">
            <stop offset="0" style={{ stopColor: 'var(--yr-sky)' }} />
            <stop offset="0.5" style={{ stopColor: 'var(--yr-orchid)' }} />
            <stop offset="1" style={{ stopColor: 'var(--yr-coral)' }} />
          </linearGradient>
        </defs>
        <path
          pathLength={1}
          d="M2 30 C 30 30, 40 8, 70 12 S 110 34, 140 26 S 180 4, 210 10 S 260 34, 298 14"
          fill="none"
          stroke={`url(#${gradient})`}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
      <div className="yr-compares">
        {everests >= 1 && (
          <p className="yr-compare yr-reveal" style={after(900)}>
            <span className="yr-badge">
              <Mountain />
            </span>
            <span>
              <strong>{formatNumber(everests, 1)}×</strong>{' '}
              {m.year_review_everest()}
            </span>
          </p>
        )}
        {earthShare >= 0.01 && (
          <p className="yr-compare yr-reveal" style={after(1000)}>
            <span className="yr-badge" data-tone="sky">
              <Globe2 />
            </span>
            <span>
              <strong>{formatPercent(earthShare)}</strong>{' '}
              {m.year_review_earth()}
            </span>
          </p>
        )}
      </div>
    </Slide>
  );
}
