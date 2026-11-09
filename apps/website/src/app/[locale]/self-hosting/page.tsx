import { initLocale } from '@/i18n/server';
import { localePath } from '@/utils/locales';
import { permanentRedirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

/** Self-hosting is explained on the open-source page. */
export default async function SelfHostingPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  permanentRedirect(`${localePath(locale, '/open-source')}#self-host`);
}
