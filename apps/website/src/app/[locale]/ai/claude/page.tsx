import { GUIDE_BRANDS } from '@/components/ai-guides/brands';
import { AiGuidePage } from '@/components/ai-guides/guide-page';
import { initLocale } from '@/i18n/server';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

const brand = GUIDE_BRANDS.claude;

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: brand.path,
    title: brand.seoTitle(),
    description: brand.seoDescription(),
  });
}

export default async function ClaudeGuidePage({ params }: Props) {
  const locale = initLocale((await params).locale);
  return <AiGuidePage locale={locale} brand={brand} />;
}
