import { learnTerms } from '@/content/learn';
import {
  LEARN_THEMES,
  type LearnLink,
  type LearnTerm,
  type LearnTheme,
} from '@/content/learn/types';
import { ogContent } from '@/lib/og-titles';
import { DATE_LOCALES, type SupportedLocale } from '@/utils/locales';

export function getLearnTerm(slug: string): LearnTerm | undefined {
  return learnTerms.find((term) => term.slug === slug);
}

/** Terms in alphabetical order of their name in this language. */
export function sortedLearnTerms(
  locale: SupportedLocale,
  terms: LearnTerm[] = learnTerms,
): LearnTerm[] {
  const collator = new Intl.Collator(DATE_LOCALES[locale], {
    sensitivity: 'base',
    numeric: true,
  });
  return [...terms].sort((a, b) =>
    collator.compare(a.name[locale], b.name[locale]),
  );
}

/** The hub's groups, each sorted alphabetically; empty groups dropped. */
export function learnTermsByTheme(
  locale: SupportedLocale,
): Array<{ theme: LearnTheme; terms: LearnTerm[] }> {
  const sorted = sortedLearnTerms(locale);
  return LEARN_THEMES.map((theme) => ({
    theme,
    terms: sorted.filter((term) => term.theme === theme),
  })).filter((group) => group.terms.length > 0);
}

/** Related terms that exist, in the order the term lists them. */
export function relatedLearnTerms(term: LearnTerm): LearnTerm[] {
  return term.related
    .map(getLearnTerm)
    .filter((other): other is LearnTerm => !!other && other !== term);
}

/** A link of a term with its label, from the page's own title by default. */
export function resolveLearnLink(
  link: LearnLink,
  locale: SupportedLocale,
): { href: string; label: string; kicker?: string } {
  if (typeof link !== 'string') {
    return {
      href: link.href,
      label: link.label[locale],
      kicker: ogContent(locale, link.href).kicker,
    };
  }
  const { kicker, title } = ogContent(locale, link);
  return { href: link, label: title, kicker };
}
