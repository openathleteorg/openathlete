import { m } from '@/paraglide/messages';

import type { PlanSport } from './catalog';

/** The race named in the reader's language: URLs keep the English slug. */
export function distanceLabel(distance: string, capitalised = false) {
  if (distance === 'marathon')
    return capitalised ? m.tplan_d_marathon_title() : m.tplan_d_marathon();
  if (distance === 'half-marathon')
    return capitalised ? m.tplan_d_half_title() : m.tplan_d_half();
  if (distance === '10k')
    return capitalised ? m.tplan_d_10k_title() : m.tplan_d_10k();
  return distance;
}

export function sportLabel(sport: PlanSport) {
  if (sport === 'trail') return m.plans_hub_trail();
  if (sport === 'triathlon') return m.plans_hub_triathlon();
  return m.plans_hub_running();
}
