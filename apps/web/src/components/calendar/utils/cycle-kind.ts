import { m } from '@/paraglide/messages';
import {
  Bandage,
  CalendarRange,
  LucideIcon,
  Plane,
  Thermometer,
} from 'lucide-react';

import { CYCLE_KIND } from '@openathlete/shared';

export const cycleKindLabel: Record<CYCLE_KIND, () => string> = {
  [CYCLE_KIND.TRAINING]: m.cycle_kind_training,
  [CYCLE_KIND.TRAVEL]: m.cycle_kind_travel,
  [CYCLE_KIND.ILLNESS]: m.cycle_kind_illness,
  [CYCLE_KIND.INJURY]: m.cycle_kind_injury,
};

export const cycleKindIcon: Record<CYCLE_KIND, LucideIcon> = {
  [CYCLE_KIND.TRAINING]: CalendarRange,
  [CYCLE_KIND.TRAVEL]: Plane,
  [CYCLE_KIND.ILLNESS]: Thermometer,
  [CYCLE_KIND.INJURY]: Bandage,
};

/** A period the athlete cannot train */
export const isUnavailableKind = (kind: `${CYCLE_KIND}` | null | undefined) =>
  !!kind && kind !== CYCLE_KIND.TRAINING;

/** Periods without training are hatched grey, whatever their colour */
export const cycleBackground = (cycle: {
  kind?: `${CYCLE_KIND}` | null;
  color?: string | null;
}) =>
  isUnavailableKind(cycle.kind)
    ? 'repeating-linear-gradient(135deg, #6b7280 0 6px, #8b93a1 6px 12px)'
    : cycle.color || '#3b82f6';
