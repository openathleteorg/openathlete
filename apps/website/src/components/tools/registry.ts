import { m } from '@/paraglide/messages';
import { Gauge, HeartPulse, Timer, TrendingUp } from 'lucide-react';

/** The calculators, in the order the hub lists them. */
export const TOOLS = [
  {
    slug: 'vma',
    icon: Gauge,
    color: 'text-sky-strong bg-sky/15',
    name: () => m.tools_vma_name(),
    card: () => m.tools_vma_card(),
  },
  {
    slug: 'heart-rate-zones',
    icon: HeartPulse,
    color: 'text-coral-strong bg-coral/15',
    name: () => m.tools_hr_name(),
    card: () => m.tools_hr_card(),
  },
  {
    slug: 'race-predictor',
    icon: TrendingUp,
    color: 'text-orchid-strong bg-orchid/15',
    name: () => m.tools_rp_name(),
    card: () => m.tools_rp_card(),
  },
  {
    slug: 'pace-calculator',
    icon: Timer,
    color: 'text-mint-strong bg-mint/20',
    name: () => m.tools_pace_name(),
    card: () => m.tools_pace_card(),
  },
] as const;

export type ToolSlug = (typeof TOOLS)[number]['slug'];
