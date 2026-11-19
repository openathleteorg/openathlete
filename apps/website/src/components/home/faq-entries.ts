import { supporterPriceVars } from '@/lib/supporter-prices';
import { m } from '@/paraglide/messages';
import type { SupportedLocale } from '@/utils/locales';

type Message = (inputs: Record<string, string>) => string;

export function homeFaqEntries(locale: SupportedLocale) {
  const prices = supporterPriceVars(locale);
  const message = (key: string) =>
    (m[key as keyof typeof m] as Message)(prices);
  return [1, 2, 3, 4, 5, 6, 7].map((index) => ({
    question: message(`home_faq_${index}_q`),
    answer: message(`home_faq_${index}_a`),
  }));
}
