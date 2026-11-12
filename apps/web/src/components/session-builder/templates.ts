import { m } from '@/paraglide/messages';

import { SPORT_TYPE } from '@openathlete/shared';

export interface QuickTemplate {
  label: () => string;
  /** Workout text: what the template inserts */
  text: string;
}

const RUN: QuickTemplate[] = [
  { label: () => m.builder_tpl_warmup(), text: "Warmup 15' Z2" },
  { label: () => m.builder_tpl_easy(), text: "45' Z2" },
  { label: () => m.builder_tpl_short_intervals(), text: '10x30/30 Z5' },
  { label: () => m.builder_tpl_track(), text: "6x(1km Z4 / 2' Z1)" },
  { label: () => m.builder_tpl_threshold(), text: "3x(10' Z3 / 2' Z1)" },
  {
    label: () => m.builder_tpl_pyramid(),
    text: "1' Z5 r1' Z1\n2' Z5 r1' Z1\n3' Z5 r2' Z1\n2' Z5 r1' Z1\n1' Z5",
  },
  { label: () => m.builder_tpl_hills(), text: '8x(45" Z5 / lap Z1)' },
  { label: () => m.builder_tpl_strides(), text: '6x(20" Z5 / 40" Z1)' },
  { label: () => m.builder_tpl_cooldown(), text: "Cooldown 10' Z1" },
];

const RIDE: QuickTemplate[] = [
  { label: () => m.builder_tpl_warmup(), text: "Warmup 15' Z2" },
  { label: () => m.builder_tpl_endurance(), text: '1h30 Z2' },
  { label: () => m.builder_tpl_sweet_spot(), text: "3x(12' 88-93% / 5' Z1)" },
  { label: () => m.builder_tpl_vo2(), text: "5x(3' 110-120% / 3' Z1)" },
  {
    label: () => m.builder_tpl_short_intervals(),
    text: "2x(10x30/30 120%, 5' Z1)",
  },
  { label: () => m.builder_tpl_sprints(), text: '6x(10" Z6 / 4\'50 Z1)' },
  { label: () => m.builder_tpl_cooldown(), text: "Cooldown 10' Z1" },
];

const SWIM: QuickTemplate[] = [
  { label: () => m.builder_tpl_warmup(), text: 'Warmup 400m Z1' },
  { label: () => m.builder_tpl_swim_aerobic(), text: '10x(100m Z3 / 15s)' },
  { label: () => m.builder_tpl_swim_speed(), text: '8x(50m Z5 / 30s)' },
  { label: () => m.builder_tpl_swim_pull(), text: '4x(200m Z2 / 20s)' },
  { label: () => m.builder_tpl_cooldown(), text: 'Cooldown 200m Z1' },
];

export function quickTemplates(sport: SPORT_TYPE): QuickTemplate[] {
  switch (sport) {
    case SPORT_TYPE.CYCLING:
    case SPORT_TYPE.VIRTUAL_RIDE:
    case SPORT_TYPE.GRAVEL_RIDE:
    case SPORT_TYPE.MOUNTAIN_BIKE_RIDE:
      return RIDE;
    case SPORT_TYPE.SWIMMING:
      return SWIM;
    default:
      return RUN;
  }
}
