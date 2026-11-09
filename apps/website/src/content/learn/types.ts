import type { SupportedLocale } from '@/utils/locales';
import type { ReactNode } from 'react';

/** Glossary pages exist in every language: no English fallback. */
export type Localized<T = string> = Record<SupportedLocale, T>;

/** Groups of the hub page, in this order. */
export const LEARN_THEMES = ['load', 'intensity', 'racing'] as const;
export type LearnTheme = (typeof LEARN_THEMES)[number];

/**
 * A page of the site, as a path without the locale prefix
 * ('/tools/vma', '/blog/what-is-trimp-and-how-to-use-it'). Its title is
 * looked up like the social cards' (lib/og-titles.ts); give a label when
 * that title does not read well as a link.
 */
export type LearnLink = string | { href: string; label: Localized };

export interface LearnSource {
  /** Full citation, in its original language: authors (year). Title. Journal. */
  citation: string;
  /** DOI or PubMed page: only a link you have checked. */
  url?: string;
}

export interface LearnFaq {
  question: string;
  /** Plain text: it goes into the FAQPage JSON-LD as is. */
  answer: string;
}

export interface LearnTerm {
  /** URL segment: /learn/<slug>. Never change it once published. */
  slug: string;
  theme: LearnTheme;
  /** Name in lists, related terms and the DefinedTerm: 'TRIMP', 'Zone 2'. */
  name: Localized;
  /** H1 and <title>, ≤ 65 characters: 'TRIMP: definition, formula, example'. */
  title: Localized;
  /** Meta description, ≤ 155 characters. */
  description: Localized;
  /** One sentence that answers 'what is X', shown in the box under the H1. */
  definition: Localized;
  /** Other names people search for: 'Training impulse', 'Form'. */
  aliases?: Partial<Localized<string[]>>;
  /** Two or three questions, for the FAQ block and its JSON-LD. */
  faq: Localized<LearnFaq[]>;
  /** Slugs of other glossary terms. */
  related: string[];
  /** Tools, features, pace charts and blog posts worth opening next. */
  links: LearnLink[];
  sources: LearnSource[];
  /** ISO date of the last real change to the text. */
  updatedAt: string;
  /** Article bodies, one per language. */
  content: Localized<() => ReactNode>;
}
