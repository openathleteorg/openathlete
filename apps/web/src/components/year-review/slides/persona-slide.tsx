import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { CSSProperties } from 'react';

import { YEAR_REVIEW_PERSONA_HOURS, YearReviewDto } from '@openathlete/shared';

import {
  formatNumber,
  formatPercent,
  formatShortDuration,
  formatTimeOfDay,
} from '../format';
import { PERSONA_NAMES } from '../persona';
import { after } from '../story/after';
import { Eyebrow, Slide } from '../story/slide';
import { SlideProps } from './types';

/** The figure behind the persona, and what it counts */
function proof({ kind, value }: YearReviewDto['persona']): [string, string] {
  switch (kind) {
    case 'EARLY_BIRD':
      return [formatPercent(value), m.year_review_proof_early()];
    case 'LUNCH_BREAK':
      return [formatPercent(value), m.year_review_proof_lunch()];
    case 'NIGHT_OWL':
      return [formatPercent(value), m.year_review_proof_night()];
    case 'WEEKEND_WARRIOR':
      return [formatPercent(value), m.year_review_proof_weekend()];
    case 'ALL_ROUNDER':
      return [formatNumber(value), m.year_review_proof_all_rounder()];
    case 'ENDURANCE':
      return [formatShortDuration(value), m.year_review_proof_endurance()];
    case 'METRONOME':
    case 'BALANCED':
      return [formatNumber(value), m.year_review_proof_active_days()];
  }
}

export function PersonaSlide({ review }: SlideProps) {
  const { persona, hours, favoriteMinute, plan, sports } = review;
  const [name, accent] = PERSONA_NAMES[persona.kind]();
  const [figure, caption] = proof(persona);
  const busiest = Math.max(...hours);
  const window =
    persona.kind in YEAR_REVIEW_PERSONA_HOURS
      ? YEAR_REVIEW_PERSONA_HOURS[
          persona.kind as keyof typeof YEAR_REVIEW_PERSONA_HOURS
        ]
      : null;
  const inWindow = (hour: number) =>
    window ? hour >= window[0] && hour < window[1] : hours[hour] === busiest;

  return (
    <Slide>
      <Eyebrow>{m.year_review_persona_eyebrow()}</Eyebrow>
      <p className="yr-persona-name yr-reveal" style={after(100)}>
        {name}
        <br />
        <span className="yr-gradient">{accent}</span>
      </p>
      <p className="yr-key yr-reveal" style={after(250)}>
        <b className="yr-gradient">{figure}</b>
        <span>{caption}</span>
      </p>
      <div className="yr-day yr-reveal" style={after(350)}>
        <div
          className="yr-columns"
          role="img"
          aria-label={m.year_review_hours_chart()}
          style={
            {
              '--count': 24,
              '--gap': '0.7cqw',
              '--height': '30cqw',
              '--step': '40ms',
            } as CSSProperties
          }
        >
          {window && (
            <span
              className="yr-day-window"
              style={
                { '--from': window[0], '--to': window[1] } as CSSProperties
              }
            />
          )}
          {hours.map((count, hour) => (
            <i
              key={hour}
              className="yr-column"
              data-dawn={count && inWindow(hour) ? '' : undefined}
              data-empty={count ? undefined : ''}
              style={
                {
                  '--i': hour,
                  '--h': count ? `${6 + (count / busiest) * 94}%` : '3%',
                } as CSSProperties
              }
            />
          ))}
        </div>
        {favoriteMinute !== null && (
          <span
            className="yr-day-peak"
            style={{ '--at': favoriteMinute / 60 } as CSSProperties}
          >
            {m.year_review_favorite_time({
              time: formatTimeOfDay(favoriteMinute),
            })}
          </span>
        )}
        <div className="yr-axis-spread">
          {[0, 6, 12, 18, 24].map((hour) => (
            <span key={hour}>{hour}</span>
          ))}
        </div>
      </div>
      <ul className="yr-facts yr-push">
        <li className="yr-fact yr-reveal" style={after(500)}>
          {m.year_review_fact_sport({
            sport: sportTypeLabelMap[sports[0].sport],
          })}
        </li>
        {plan && (
          <li className="yr-fact yr-reveal" style={after(600)}>
            {m.year_review_fact_plan({
              share: formatPercent(plan.done / plan.planned),
            })}
          </li>
        )}
      </ul>
    </Slide>
  );
}
