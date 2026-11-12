import { m } from '@/paraglide/messages';

/**
 * Names of the catalog vocabulary. Exhaustive maps, written out: Paraglide
 * keeps only the messages the code calls by name.
 */
const BODY_PART: Record<string, () => string> = {
  'upper arms': m.exo_part_upper_arms,
  'upper legs': m.exo_part_upper_legs,
  back: m.exo_part_back,
  waist: m.exo_part_waist,
  chest: m.exo_part_chest,
  shoulders: m.exo_part_shoulders,
  'lower legs': m.exo_part_lower_legs,
  'lower arms': m.exo_part_lower_arms,
  cardio: m.exo_part_cardio,
  neck: m.exo_part_neck,
};

const EQUIPMENT: Record<string, () => string> = {
  'body weight': m.exo_eq_body_weight,
  dumbbell: m.exo_eq_dumbbell,
  cable: m.exo_eq_cable,
  barbell: m.exo_eq_barbell,
  'leverage machine': m.exo_eq_leverage_machine,
  band: m.exo_eq_band,
  'smith machine': m.exo_eq_smith_machine,
  kettlebell: m.exo_eq_kettlebell,
  weighted: m.exo_eq_weighted,
  'stability ball': m.exo_eq_stability_ball,
  'ez barbell': m.exo_eq_ez_barbell,
  assisted: m.exo_eq_assisted,
  'medicine ball': m.exo_eq_medicine_ball,
  roller: m.exo_eq_roller,
  rope: m.exo_eq_rope,
  'bosu ball': m.exo_eq_bosu_ball,
  'cardio machine': m.exo_eq_cardio_machine,
  other: m.exo_eq_other,
};

const TARGET: Record<string, () => string> = {
  abs: m.exo_target_abs,
  pectorals: m.exo_target_pectorals,
  biceps: m.exo_target_biceps,
  delts: m.exo_target_delts,
  glutes: m.exo_target_glutes,
  triceps: m.exo_target_triceps,
  'upper back': m.exo_target_upper_back,
  lats: m.exo_target_lats,
  calves: m.exo_target_calves,
  quads: m.exo_target_quads,
  forearms: m.exo_target_forearms,
  hamstrings: m.exo_target_hamstrings,
  'cardiovascular system': m.exo_target_cardiovascular_system,
  spine: m.exo_target_spine,
  traps: m.exo_target_traps,
  abductors: m.exo_target_abductors,
  'serratus anterior': m.exo_target_serratus_anterior,
  adductors: m.exo_target_adductors,
  'levator scapulae': m.exo_target_levator_scapulae,
};

export const BODY_PARTS = Object.keys(BODY_PART);
export const EQUIPMENTS = Object.keys(EQUIPMENT);

export const bodyPartLabel = (key: string | null | undefined) =>
  key ? (BODY_PART[key]?.() ?? key) : '';
export const equipmentLabel = (key: string | null | undefined) =>
  key ? (EQUIPMENT[key]?.() ?? key) : '';
export const targetLabel = (key: string | null | undefined) =>
  key ? (TARGET[key]?.() ?? key) : '';
