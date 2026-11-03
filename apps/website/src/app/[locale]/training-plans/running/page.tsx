import { PlansHub } from '@/components/training-plan/plans-hub';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/training-plans/running',
    title: m.plans_hub_running_seo_title(),
    description: m.plans_hub_running_seo_description(),
  });
}

export default async function Page({ params }: Props) {
  const locale = initLocale((await params).locale);
  return (
    <PlansHub
      locale={locale}
      sport="running"
      title={m.plans_hub_running_h1()}
    />
  );
}
