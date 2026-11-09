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

/**
 * Reads a message by its key, for the numbered lists of the feature pages
 * (points, FAQ entries, table rows). Only for messages without inputs.
 */
export function msg(key: string): string {
  const fn = (m as unknown as Record<string, (() => string) | undefined>)[key];
  return fn ? fn() : key;
}

/** `features_x_faq_1_q` … for `count` entries. */
export function faqEntries(prefix: string, count: number): FaqEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    question: msg(`${prefix}_${i + 1}_q`),
    answer: msg(`${prefix}_${i + 1}_a`),
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
