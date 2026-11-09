import { ComparePage } from '@/components/compare/compare-page';
import { msg } from '@/components/compare/text';
import { COMPETITORS, findCompetitor } from '@/content/competitors';
import { initLocale } from '@/i18n/server';
import { notFound } from 'next/navigation';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string; competitor: string }> };

/* eslint-disable react-refresh/only-export-components */
export function generateStaticParams() {
  return COMPETITORS.map(({ slug }) => ({ competitor: slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { locale: raw, competitor: slug } = await params;
  const locale = initLocale(raw);
  const competitor = findCompetitor(slug);
  if (!competitor) notFound();
  return pageMetadata({
    locale,
    path: `/compare/${competitor.slug}`,
    title: msg(`compare_${competitor.prefix}_seo_title`),
    description: msg(`compare_${competitor.prefix}_seo_description`),
    type: 'article',
  });
}
/* eslint-enable react-refresh/only-export-components */

export default async function CompetitorPage({ params }: Props) {
  const { locale: raw, competitor: slug } = await params;
  const locale = initLocale(raw);
  const competitor = findCompetitor(slug);
  if (!competitor) notFound();
  return <ComparePage competitor={competitor} locale={locale} />;
}
