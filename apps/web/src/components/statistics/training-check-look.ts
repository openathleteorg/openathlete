import { m } from '@/paraglide/messages';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleDashed,
  Equal,
  TriangleAlert,
} from 'lucide-react';

import {
  CheckStatus,
  TrainingCheckDto,
  formatSpeed,
  formatSpeedUnit,
} from '@openathlete/shared';

// Arrows and words carry the answer; the tints differ in lightness as well
export type CheckLook = CheckStatus | TrainingCheckDto['design']['status'];
export const CHECK_STATUS: Record<
  CheckLook,
  { icon: typeof ArrowUp; label: () => string; tint: string; text: string }
> = {
  BETTER: {
    icon: ArrowUp,
    label: m.check_status_better,
    tint: 'bg-teal-100 dark:bg-teal-950',
    text: 'text-teal-800 dark:text-teal-300',
  },
  SAME: {
    icon: Equal,
    label: m.check_status_same,
    tint: 'bg-muted',
    text: 'text-muted-foreground',
  },
  WORSE: {
    icon: ArrowDown,
    label: m.check_status_worse,
    tint: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-800 dark:text-orange-300',
  },
  // How the weeks were built has no better or worse: fine, or one note
  FINE: {
    icon: Check,
    label: m.check_status_fine,
    tint: 'bg-muted',
    text: 'text-muted-foreground',
  },
  NOTE: {
    icon: TriangleAlert,
    label: m.check_status_note,
    tint: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-800 dark:text-orange-300',
  },
  OPEN: {
    icon: CircleDashed,
    label: m.check_status_open,
    tint: 'border border-dashed',
    text: 'text-muted-foreground',
  },
};

/** A speed in m/s as a pace */
export const formatRunPace = (speed: number) =>
  `${formatSpeed(speed, 'min/km')} ${formatSpeedUnit('min/km')}`;
