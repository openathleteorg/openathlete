import { m } from '@/paraglide/messages';

import { YearReviewPersona } from '@openathlete/shared';

/** The two lines of each persona's name, the second in the gradient */
export const PERSONA_NAMES: Record<YearReviewPersona, () => [string, string]> =
  {
    EARLY_BIRD: () => [
      m.year_review_persona_early(),
      m.year_review_persona_early_accent(),
    ],
    LUNCH_BREAK: () => [
      m.year_review_persona_lunch(),
      m.year_review_persona_lunch_accent(),
    ],
    NIGHT_OWL: () => [
      m.year_review_persona_night(),
      m.year_review_persona_night_accent(),
    ],
    WEEKEND_WARRIOR: () => [
      m.year_review_persona_weekend(),
      m.year_review_persona_weekend_accent(),
    ],
    ALL_ROUNDER: () => [
      m.year_review_persona_all_rounder(),
      m.year_review_persona_all_rounder_accent(),
    ],
    METRONOME: () => [
      m.year_review_persona_metronome(),
      m.year_review_persona_metronome_accent(),
    ],
    ENDURANCE: () => [
      m.year_review_persona_endurance(),
      m.year_review_persona_endurance_accent(),
    ],
    BALANCED: () => [
      m.year_review_persona_balanced(),
      m.year_review_persona_balanced_accent(),
    ],
  };
