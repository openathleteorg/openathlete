import { initLocale } from '@/i18n/server';
import { localePath } from '@/utils/locales';
import { permanentRedirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

/** Short address kept for old links: the AI page lives under /features. */
export default async function AiRedirect({ params }: Props) {
  const locale = initLocale((await params).locale);
  permanentRedirect(localePath(locale, '/features/ai-coach'));
}
