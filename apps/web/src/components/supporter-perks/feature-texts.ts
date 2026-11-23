import { m } from '@/paraglide/messages';

import { Feature } from '@openathlete/shared';

interface FeatureTexts {
  /** Paywall title: what the feature is, thanks to whom */
  title: () => string;
  /** One sentence: what it does for the user */
  body: () => string;
}

/** The paywall texts of each feature, in every language */
export const FEATURE_TEXTS: Record<Feature, FeatureTexts> = {
  [Feature.STATISTICS_COMPARE]: {
    title: m.feature_statistics_compare_title,
    body: m.feature_statistics_compare_body,
  },
  [Feature.LAB]: { title: m.feature_lab_title, body: m.feature_lab_body },
  [Feature.COACH_COLUMNS]: {
    title: m.feature_coach_columns_title,
    body: m.feature_coach_columns_body,
  },
  [Feature.COACH_THRESHOLDS]: {
    title: m.feature_coach_thresholds_title,
    body: m.feature_coach_thresholds_body,
  },
  [Feature.COACH_COMPARE]: {
    title: m.feature_coach_compare_title,
    body: m.feature_coach_compare_body,
  },
  [Feature.COACH_BROADCAST]: {
    title: m.feature_coach_broadcast_title,
    body: m.feature_coach_broadcast_body,
  },
  [Feature.COACH_QUESTIONNAIRES]: {
    title: m.feature_coach_questionnaires_title,
    body: m.feature_coach_questionnaires_body,
  },
  [Feature.CLUBS]: { title: m.feature_clubs_title, body: m.feature_clubs_body },
  [Feature.IMAGES]: {
    title: m.feature_images_title,
    body: m.feature_images_body,
  },
  [Feature.THEMES]: {
    title: m.feature_themes_title,
    body: m.feature_themes_body,
  },
};

/** Message key prefix of a feature, for the catalogue test */
export function featureMessageKey(feature: Feature): string {
  return `feature_${feature.replace(/-/g, '_')}`;
}
