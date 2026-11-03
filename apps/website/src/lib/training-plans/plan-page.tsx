/* eslint-disable react-refresh/only-export-components -- route helpers, not a component module */
import { generateMetadata as pageMetadata } from '@/app/metadata';
import { PlanDetail } from '@/components/training-plan/plan-detail';
import { TrailPlanDetail } from '@/components/training-plan/trail-plan-detail';
import { SUPPORTED_LOCALES, initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  type PlanSport,
  formatGoalTime,
  listPlans,
  planStats,
} from './catalog';
import { distanceLabel } from './labels';
import { loadPlan } from './plan-loader';
import { trailTitleValues } from './trail';

/**
 * The three plan routes (running, trail, triathlon) differ only by the name
 * of their second segment: they share these helpers.
 */
export function planStaticParams(sport: PlanSport, variantParam: string) {
  return listPlans()
    .filter((plan) => plan.sport === sport)
    .flatMap((plan) =>
      SUPPORTED_LOCALES.map((locale) => ({
        locale,
        distance: plan.distance,
        [variantParam]: plan.variant,
      })),
    );
}

async function resolve(
  sport: PlanSport,
  rawLocale: string,
  distance: string,
  variant: string,
) {
  const locale = initLocale(rawLocale);
  const entry = listPlans().find(
    (plan) =>
      plan.sport === sport &&
      plan.distance === distance &&
      plan.variant === variant,
  );
  if (!entry) notFound();
  const data = await loadPlan(sport, distance, variant, locale);
  return { locale, entry, data };
}

export async function planMetadata(
  sport: PlanSport,
  rawLocale: string,
  distance: string,
  variant: string,
): Promise<Metadata> {
  const { locale, entry, data } = await resolve(
    sport,
    rawLocale,
    distance,
    variant,
  );
  if (sport === 'trail') {
    const trail = trailTitleValues(locale, distance, data);
    const metadata = pageMetadata({
      locale,
      path: entry.path,
      title: m.trailplan_seo_title(trail),
      description: m.trailplan_seo_description(trail),
      locales: entry.locales,
    });
    return entry.locales.includes(locale)
      ? metadata
      : { ...metadata, robots: { index: false, follow: true } };
  }
  const values = {
    distance: distanceLabel(distance),
    time: data.plan.timeTarget ? formatGoalTime(data.plan.timeTarget) : variant,
    weeks: String(planStats(data).weeks),
  };
  const metadata = pageMetadata({
    locale,
    path: entry.path,
    title: m.tplan_seo_title(values),
    description: m.tplan_seo_description(values),
    // Untranslated plans show the English sessions: hreflang only lists
    // the real translations
    locales: entry.locales,
  });
  return entry.locales.includes(locale)
    ? metadata
    : { ...metadata, robots: { index: false, follow: true } };
}

export async function PlanRoutePage({
  sport,
  locale: rawLocale,
  distance,
  variant,
}: {
  sport: PlanSport;
  locale: string;
  distance: string;
  variant: string;
}) {
  const { locale, entry, data } = await resolve(
    sport,
    rawLocale,
    distance,
    variant,
  );
  if (sport === 'trail')
    return <TrailPlanDetail locale={locale} entry={entry} data={data} />;
  return <PlanDetail locale={locale} entry={entry} data={data} />;
}
