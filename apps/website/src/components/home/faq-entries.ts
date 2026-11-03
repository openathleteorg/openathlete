import { m } from '@/paraglide/messages';

export function homeFaqEntries() {
  return [1, 2, 3, 4, 5, 6, 7].map((index) => ({
    question: (m[`home_faq_${index}_q` as keyof typeof m] as () => string)(),
    answer: (m[`home_faq_${index}_a` as keyof typeof m] as () => string)(),
  }));
}
