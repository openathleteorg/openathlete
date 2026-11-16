import type { FaqEntry } from '@/components/site/faq';
import { m } from '@/paraglide/messages';
import {
  Activity,
  Bot,
  CalendarDays,
  Sparkles,
  Watch,
  Workflow,
} from 'lucide-react';

type Inputs = Record<string, string>;

/**
 * Reads a message by its key, for the numbered lists of the feature pages
 * (points, FAQ entries, table rows). Inputs a message does not use are
 * ignored.
 */
export function msg(key: string, inputs: Inputs = {}): string {
  const fn = (
    m as unknown as Record<string, ((inputs: Inputs) => string) | undefined>
  )[key];
  return fn ? fn(inputs) : key;
}

/**
 * `features_x_faq_1_q` … for `count` entries. Answers quoting a price take it
 * from `inputs` (supporterPriceVars).
 */
export function faqEntries(
  prefix: string,
  count: number,
  inputs: Inputs = {},
): FaqEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    question: msg(`${prefix}_${i + 1}_q`, inputs),
    answer: msg(`${prefix}_${i + 1}_a`, inputs),
  }));
}

export const FEATURE_PAGES = [
  { slug: 'training-calendar', id: 'calendar', icon: CalendarDays },
  { slug: 'workout-builder', id: 'builder', icon: Workflow },
  { slug: 'training-load', id: 'load', icon: Activity },
  { slug: 'ai-coach', id: 'ai', icon: Sparkles },
  { slug: 'mcp-server', id: 'mcp', icon: Bot },
  { slug: 'watch-sync', id: 'sync', icon: Watch },
] as const;

export type FeatureId = (typeof FEATURE_PAGES)[number]['id'];

export function featureTitle(id: FeatureId): string {
  return msg(`features_nav_${id}_title`);
}
