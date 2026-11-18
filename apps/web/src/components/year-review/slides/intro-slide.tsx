import { m } from '@/paraglide/messages';
import { CSSProperties } from 'react';

import { BrandLogoLayers } from '../brand-logo-layers';
import { after } from '../story/after';
import { Slide, Title } from '../story/slide';
import { SlideProps } from './types';

const touchScreen = () => matchMedia('(pointer: coarse)').matches;

export function IntroSlide({ review }: SlideProps) {
  return (
    <Slide className="yr-intro">
      <BrandLogoLayers />
      <div className="yr-year" aria-label={String(review.year)}>
        {[...String(review.year)].map((digit, index) => (
          <span
            key={index}
            aria-hidden
            style={{ '--i': index } as CSSProperties}
          >
            {digit}
          </span>
        ))}
      </div>
      <Title delay={900} accent={m.year_review_intro_title_accent()}>
        {m.year_review_intro_title()}
      </Title>
      <p className="yr-lead yr-reveal" style={after(1100)}>
        {m.year_review_intro_lead()}
      </p>
      <p className="yr-tap-hint yr-reveal" style={after(1500)}>
        {touchScreen() ? m.year_review_hint_tap() : m.year_review_hint_click()}
      </p>
    </Slide>
  );
}
