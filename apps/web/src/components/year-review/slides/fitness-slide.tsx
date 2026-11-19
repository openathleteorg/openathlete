import { m } from '@/paraglide/messages';
import { CSSProperties, useId, useMemo } from 'react';

import {
  formatDayMonth,
  formatNumber,
  formatPercent,
  monthName,
} from '../format';
import { after } from '../story/after';
import { Eyebrow, Slide, Stat, Title } from '../story/slide';
import { SlideProps } from './types';

const WIDTH = 300;
const HEIGHT = 150;
const TOP = 18;
const BOTTOM = 140;

const dayOfYear = (date: string, year: number) =>
  (Date.parse(`${date}T00:00:00Z`) - Date.UTC(year, 0, 1)) / 86_400_000;

export function FitnessSlide({ review }: SlideProps) {
  const ids = useId();
  const fitness = review.fitness!;
  const { points, peak } = fitness;
  const first = points[0].ctl;
  const last = points[points.length - 1].ctl;

  const chart = useMemo(() => {
    const values = points.map((point) => point.ctl);
    const low = Math.min(...values) * 0.85;
    const high = Math.max(...values);
    const x = (date: string) => (dayOfYear(date, review.year) / 365) * WIDTH;
    const y = (ctl: number) =>
      BOTTOM - ((ctl - low) / (high - low || 1)) * (BOTTOM - TOP);
    const line = points
      .map(
        (point, index) =>
          `${index ? 'L' : 'M'}${x(point.date).toFixed(1)} ${y(point.ctl).toFixed(1)}`,
      )
      .join(' ');
    const lastX = x(points[points.length - 1].date).toFixed(1);
    const race =
      review.highlight?.kind === 'RACE'
        ? points.reduce((closest, point) =>
            Math.abs(
              Date.parse(point.date) - review.highlight!.date.getTime(),
            ) <
            Math.abs(
              Date.parse(closest.date) - review.highlight!.date.getTime(),
            )
              ? point
              : closest,
          )
        : null;
    return {
      line,
      area: `${line} L${lastX} ${HEIGHT} L0 ${HEIGHT} Z`,
      peak: { x: x(peak.date), y: y(peak.ctl) },
      race: race ? { x: x(race.date), y: y(race.ctl) } : null,
    };
  }, [points, peak, review.highlight, review.year]);

  const gain = first > 0 ? (last - first) / first : null;
  const plan = review.plan;
  // Two tiles, from the most telling the year has
  const stats = [
    gain !== null && {
      key: 'gain',
      tone: 'mint' as const,
      value: `${gain > 0 ? '+' : ''}${formatPercent(gain)}`,
      label: m.year_review_fitness_gain(),
    },
    plan && {
      key: 'plan',
      value: formatPercent(plan.done / plan.planned),
      label: m.year_review_plan_done({
        done: plan.done,
        planned: plan.planned,
      }),
    },
    {
      key: 'peak',
      value: formatNumber(peak.ctl),
      label: m.year_review_fitness_peak(),
    },
  ].filter((stat) => stat !== false && stat !== null);

  return (
    <Slide>
      <Eyebrow>{m.year_review_fitness_eyebrow()}</Eyebrow>
      <Title
        accent={m.year_review_fitness_accent({
          date: formatDayMonth(peak.date),
        })}
      >
        {m.year_review_fitness_title()}
      </Title>
      <p className="yr-lead yr-reveal" style={after(250)}>
        {m.year_review_fitness_lead({ peak: formatNumber(peak.ctl) })}
      </p>
      <div className="yr-push yr-reveal" style={after(300)}>
        <svg
          className="yr-curve"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={m.year_review_fitness_chart({
            peak: formatNumber(peak.ctl),
          })}
        >
          <defs>
            <linearGradient id={`${ids}-line`} x1="0" x2="1">
              <stop offset="0" style={{ stopColor: 'var(--yr-sky)' }} />
              <stop offset="0.55" style={{ stopColor: 'var(--yr-orchid)' }} />
              <stop offset="1" style={{ stopColor: 'var(--yr-mint)' }} />
            </linearGradient>
            <linearGradient id={`${ids}-area`} x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0"
                style={{ stopColor: 'var(--yr-orchid)', stopOpacity: 0.35 }}
              />
              <stop
                offset="1"
                style={{ stopColor: 'var(--yr-orchid)', stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>
          {[30, 75, 120].map((y) => (
            <line
              key={y}
              className="yr-curve-grid"
              x1={0}
              x2={WIDTH}
              y1={y}
              y2={y}
            />
          ))}
          <path
            className="yr-curve-area"
            d={chart.area}
            fill={`url(#${ids}-area)`}
          />
          <path
            className="yr-curve-line"
            d={chart.line}
            pathLength={1}
            fill="none"
            stroke={`url(#${ids}-line)`}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {chart.race && (
            <g transform={`translate(${chart.race.x} ${chart.race.y})`}>
              <g
                className="yr-curve-marker"
                style={{ '--at': '1.3s' } as CSSProperties}
              >
                <circle r={4} style={{ fill: 'var(--yr-coral)' }} />
                <text
                  y={-10}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  style={{ fill: 'var(--yr-coral)' }}
                >
                  {m.year_review_race_marker()}
                </text>
              </g>
            </g>
          )}
          <g transform={`translate(${chart.peak.x} ${chart.peak.y})`}>
            <g
              className="yr-curve-marker"
              style={{ '--at': '2.6s' } as CSSProperties}
            >
              <circle
                className="yr-curve-halo"
                r={5}
                style={{ fill: 'var(--yr-mint)' }}
              />
              <circle
                r={5}
                strokeWidth={2}
                style={{ fill: 'var(--yr-mint)', stroke: 'var(--yr-bg)' }}
              />
              <text
                y={-12}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                style={{ fill: 'var(--yr-fg)' }}
              >
                {formatNumber(peak.ctl)}
              </text>
            </g>
          </g>
        </svg>
        <div className="yr-axis-spread">
          {[0, 3, 6, 9, 11].map((month) => (
            <span key={month}>{monthName(month, 'short')}</span>
          ))}
        </div>
      </div>
      <div className="yr-stats" style={{ '--columns': 2 } as CSSProperties}>
        {stats.slice(0, 2).map(({ key, ...stat }, index) => (
          <Stat key={key} delay={900 + index * 100} {...stat} />
        ))}
      </div>
    </Slide>
  );
}
