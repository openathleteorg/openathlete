import { SUPPORTED_LOCALES, type SupportedLocale } from '@/utils/locales';
import type { ReactNode } from 'react';

import { article1 } from './article-1';
import { article2 } from './article-2';
import { article3 } from './article-3';
import { articleClientRetention } from './article-client-retention';
import { articleCoachAthleteCommunication } from './article-coach-athlete-communication';
import { articleCognitiveLoad } from './article-cognitive-load';
import { articleDigitalizingClubs } from './article-digitalizing-clubs';
import { articleExcelIsDead } from './article-excel-is-dead';
import { articleFutureAiCoaching } from './article-future-ai-coaching';
import { articleGenerativeAiSports } from './article-generative-ai-sports';
import { articleHybridCoaching } from './article-hybrid-coaching';
import { articleInjuryPrevention2 } from './article-injury-prevention-2';
import { articleNolioTrainingpeaksComparison } from './article-nolio-trainingpeaks-comparison';
import { articleOpenathleteFreeAlternativeTrainingpeaks } from './article-openathlete-free-alternative-trainingpeaks';
import { articleOpenathleteOpensourceBenefits } from './article-openathlete-opensource-benefits';
import { articleOvertrainingSigns } from './article-overtraining-signs';
import { articlePreppingForGoal } from './article-prepping-for-goal';
import { articleProgressiveOverload } from './article-progressive-overload';
import { articleRpeVsHr } from './article-rpe-vs-hr';
import { articleSmartwatchIsntEnough } from './article-smartwatch-isnt-enough';
import { articleStopTrainingOnFeeling } from './article-stop-training-on-feeling';
import { articleSubjectiveScientific } from './article-subjective-scientific';
import { articleSyncWorkouts } from './article-sync-workouts';
import { articleTrimp } from './article-trimp';
import { articleYouthTalentDetection } from './article-youth-talent-detection';
import type { BlogPost, LocalizedText } from './types';

// Export all blog posts
export const blogPosts: BlogPost[] = [
  article1,
  article2,
  article3,
  articleRpeVsHr,
  articleGenerativeAiSports,
  articleInjuryPrevention2,
  articleSubjectiveScientific,
  articleExcelIsDead,
  articleHybridCoaching,
  articleCoachAthleteCommunication,
  articleClientRetention,
  articleStopTrainingOnFeeling,
  articleSmartwatchIsntEnough,
  articleProgressiveOverload,
  articlePreppingForGoal,
  articleDigitalizingClubs,
  articleYouthTalentDetection,
  articleNolioTrainingpeaksComparison,
  articleOpenathleteFreeAlternativeTrainingpeaks,
  articleOpenathleteOpensourceBenefits,
  articleSyncWorkouts,
  articleTrimp,
  articleFutureAiCoaching,
  articleCognitiveLoad,
  articleOvertrainingSigns,
];

// Helper function to get a post by slug
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.metadata.slug === slug);
}

// Helper function to get all posts sorted by date (newest first)
export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime(),
  );
}

// Helper function to get posts by tag
export function getPostsByTag(tag: string): BlogPost[] {
  return blogPosts.filter((post) =>
    post.metadata.tags?.some((t) =>
      t.toLowerCase().includes(tag.toLowerCase()),
    ),
  );
}

const CONTENT_BY_LOCALE = {
  en: 'ContentEn',
  fr: 'ContentFr',
  es: 'ContentEs',
  it: 'ContentIt',
  'pt-br': 'ContentPtBr',
} as const satisfies Record<SupportedLocale, keyof BlogPost>;

/** The post body in `locale`, or undefined when it is not translated. */
export function getPostContent(
  post: BlogPost,
  locale: SupportedLocale,
): (() => ReactNode) | undefined {
  const content = post[CONTENT_BY_LOCALE[locale]];
  return typeof content === 'function' ? content : undefined;
}

/** Locales the post body is written in. */
export function getPostLocales(post: BlogPost): SupportedLocale[] {
  return SUPPORTED_LOCALES.filter((locale) => getPostContent(post, locale));
}

export function getPostText(
  text: LocalizedText,
  locale: SupportedLocale,
): string {
  return text[locale] ?? text.en;
}
