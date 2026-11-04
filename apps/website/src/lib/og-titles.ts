import { getPostBySlug, getPostText } from '@/content/blog';
import { COMPETITORS } from '@/content/competitors';
import { learnTerms } from '@/content/learn';
import { paceChartTitle } from '@/lib/pace-charts/copy';
import { raceText } from '@/lib/races/copy';
import { raceBySlug } from '@/lib/races/data';
import { listPlans } from '@/lib/training-plans/catalog';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, toParaglideLocale } from '@/utils/locales';
import { readFileSync } from 'fs';
import { join } from 'path';

type Candidates = Array<string | string[]>;

/**
 * Message keys that hold each page's title, best first. A key that does not
 * exist (yet) is skipped, so a renamed message degrades to the next one and
 * finally to the site tagline instead of breaking the build.
 */
const TITLES: Record<string, Candidates> = {
  '': [['home_hero_title_1', 'home_hero_title_2'], 'home_seo_title'],
  '/features': ['features_hub_h1', 'features_hub_seo_title'],
  '/features/training-calendar': ['features_cal_h1', 'features_cal_seo_title'],
  '/features/workout-builder': ['features_wb_h1', 'features_wb_seo_title'],
  '/features/training-load': ['features_tl_h1', 'features_tl_seo_title'],
  '/features/ai-coach': ['features_ai_h1', 'features_ai_seo_title'],
  '/features/mcp-server': ['features_mcp_h1', 'features_mcp_seo_title'],
  '/features/watch-sync': ['features_sync_h1', 'features_sync_seo_title'],
  '/athletes': [
    ['athletes_hero_title_1', 'athletes_hero_title_2'],
    'athletes_seo_title',
  ],
  '/coaches': [
    ['coachespage_hero_title_1', 'coachespage_hero_title_2'],
    'coachespage_seo_title',
  ],
  '/clubs': ['clubspage_hero_title', 'clubspage_seo_title'],
  '/pricing': ['pricing_page_hero_title', 'pricing_page_seo_title'],
  '/open-source': ['opensource_hero_title', 'opensource_seo_title'],
  '/self-hosting': [
    'selfhost_hero_title',
    'selfhosting_hero_title',
    'selfhost_h1',
    'selfhost_seo_title',
    'selfhosting_seo_title',
  ],
  '/mobile': ['mobile_hero_title', 'mobile_h1', 'mobile_seo_title'],
  '/ai': [
    'ai_hero_title',
    'ai_h1',
    'aipage_hero_title',
    'ai_seo_title',
    'aipage_seo_title',
  ],
  '/compare': ['compare_hub_h1', 'compare_hub_seo_title'],
  '/connect': ['connect_hub_h1', 'connect_hub_seo_title'],
  '/blog': ['blog_h1'],
  '/tools': ['tools_hub_h1'],
  '/tools/vma': ['tools_vma_h1'],
  '/tools/heart-rate-zones': ['tools_hr_h1'],
  '/tools/race-predictor': ['tools_rp_h1'],
  '/tools/pace-calculator': ['tools_pace_h1'],
  '/tools/trail-time-estimator': ['tools_trail_h1'],
  '/tools/grade-adjusted-pace': ['tools_gap_h1'],
  '/pace-charts': ['pacechart_hub_h1'],
  '/races': ['races_hub_h1'],
  '/training-plans': ['plans_hub_h1'],
  '/training-plans/running': ['plans_hub_running_h1'],
  '/training-plans/trail': ['plans_hub_trail_h1'],
  '/training-plans/triathlon': ['plans_hub_triathlon_h1'],
  '/learn': ['learn_hub_h1'],
  '/legal-notice': ['legal_notice_title'],
  '/privacy-policy': ['privacy_policy_title'],
  '/terms-of-sale': ['terms_title'],
};

const SECTIONS: Record<string, string> = {
  features: 'site_nav_features',
  athletes: 'site_nav_athletes',
  coaches: 'site_nav_coaches',
  clubs: 'site_nav_clubs',
  pricing: 'site_nav_pricing',
  'open-source': 'site_nav_open_source',
  compare: 'site_nav_compare',
  connect: 'site_nav_integrations',
  mobile: 'site_nav_mobile',
  ai: 'site_nav_ai',
  blog: 'site_nav_blog',
  tools: 'site_nav_tools',
  'pace-charts': 'pacechart_nav_label',
  races: 'races_nav_label',
  'training-plans': 'site_nav_training_plans',
  learn: 'learn_nav_label',
  'legal-notice': 'legal_kicker',
  'privacy-policy': 'legal_kicker',
  'terms-of-sale': 'legal_kicker',
};

function message(key: string, locale: SupportedLocale): string | undefined {
  const fn = (m as unknown as Record<string, unknown>)[key];
  if (typeof fn !== 'function') return undefined;
  const text = (fn as (i: object, o: object) => string)(
    {},
    { locale: toParaglideLocale(locale) },
  );
  return typeof text === 'string' && text ? text : undefined;
}

function first(candidates: Candidates, locale: SupportedLocale) {
  for (const candidate of candidates) {
    const parts = (Array.isArray(candidate) ? candidate : [candidate]).map(
      (key) => message(key, locale),
    );
    if (parts.every(Boolean)) {
      return parts.join(' ').replace(/\s*\|\s*OpenAthlete$/, '');
    }
  }
  return undefined;
}

/** Kicker and title printed on a page's social card. */
export function ogContent(
  locale: SupportedLocale,
  path: string,
): { kicker?: string; title: string } {
  const segments = path.split('/').filter(Boolean);
  const sectionKey = SECTIONS[segments[0] ?? ''];
  const kicker = sectionKey ? message(sectionKey, locale) : undefined;
  const tagline = message('site_footer_tagline', locale) ?? 'OpenAthlete';

  let title = TITLES[path] ? first(TITLES[path], locale) : undefined;

  if (!title && segments[0] === 'blog' && segments[1]) {
    const post = getPostBySlug(segments[1]);
    if (post) title = getPostText(post.metadata.title, locale);
  }
  if (!title && segments[0] === 'compare' && segments[1]) {
    const competitor = COMPETITORS.find((c) => c.slug === segments[1]);
    if (competitor) {
      title =
        first([`compare_${competitor.prefix}_h1`], locale) ??
        `OpenAthlete vs ${competitor.name}`;
    }
  }
  if (!title && segments[0] === 'ai' && segments[1]) {
    title = first(
      [`aib_${segments[1]}_h1`, `aig_${segments[1]}_seo_title`],
      locale,
    );
  }
  if (!title && segments[0] === 'connect' && segments[1]) {
    title = first([`connect_${segments[1]}_h1`], locale);
  }
  if (!title && segments[0] === 'pace-charts' && segments.length === 3) {
    title = paceChartTitle(segments[1], segments[2], toParaglideLocale(locale));
  }
  if (!title && segments[0] === 'learn' && segments[1]) {
    const term = learnTerms.find((t) => t.slug === segments[1]);
    if (term) title = term.title[locale];
  }
  if (!title && segments[0] === 'races' && segments[1]) {
    const race = raceBySlug(segments[1]);
    if (race) title = raceText(race, 'h1', toParaglideLocale(locale));
  }
  if (!title && segments[0] === 'training-plans' && segments.length === 4) {
    const plan = listPlans().find((p) => p.path === path);
    if (plan) {
      const file = plan.locales.includes(locale) ? locale : 'en';
      const data = JSON.parse(
        readFileSync(
          join(
            process.cwd(),
            'src/lib/training-plans/plans',
            plan.sport,
            `${plan.distance}-${plan.variant}.${file}.json`,
          ),
          'utf-8',
        ),
      ) as { plan: { name: string } };
      title = data.plan.name;
    }
  }

  return { kicker, title: title ?? tagline };
}
