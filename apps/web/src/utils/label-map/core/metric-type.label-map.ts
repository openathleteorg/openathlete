import { m } from '@/paraglide/messages';

import { METRIC_TYPE } from '@openathlete/shared';

export const metricTypeLabelMap: Record<METRIC_TYPE, string> = {
  [METRIC_TYPE.WEIGHT]: m.metric_weight(),
  [METRIC_TYPE.HEIGHT]: m.metric_height(),
  [METRIC_TYPE.BMI]: m.metric_bmi(),
  [METRIC_TYPE.BODY_FAT]: m.metric_body_fat(),
  [METRIC_TYPE.MUSCLE_MASS]: m.metric_muscle_mass(),
  [METRIC_TYPE.DAILY_CALORIES]: m.metric_daily_calories(),
  [METRIC_TYPE.DAILY_STEPS]: m.metric_daily_steps(),
  [METRIC_TYPE.SLEEP_DURATION]: m.metric_sleep_duration(),
  [METRIC_TYPE.SLEEP_SCORE]: m.metric_sleep_score(),
  [METRIC_TYPE.HOOPER_INDEX]: m.metric_hooper_index(),

  [METRIC_TYPE.HR_MAX]: m.metric_hr_max(),
  [METRIC_TYPE.HR_REST]: m.metric_hr_rest(),
  [METRIC_TYPE.HR_RESERVE]: m.metric_hr_reserve(),
  [METRIC_TYPE.RMSSD]: m.metric_rmssd(),

  [METRIC_TYPE.VMA]: m.metric_vma(),
  [METRIC_TYPE.CRITICAL_POWER_RUNNING]: m.metric_critical_power_running(),
  [METRIC_TYPE.CRITICAL_POWER_CYCLING]: m.metric_critical_power_cycling(),
  [METRIC_TYPE.VO2MAX]: m.metric_vo2max(),
  [METRIC_TYPE.FTP_RUNNING]: m.metric_ftp_running(),
  [METRIC_TYPE.FTP_CYCLING]: m.metric_ftp_cycling(),
  [METRIC_TYPE.VERTICAL_SPEED_AVG]: m.metric_vertical_speed_avg(),
  [METRIC_TYPE.VERTICAL_SPEED_MAX]: m.metric_vertical_speed_max(),
  [METRIC_TYPE.FITNESS_INDEX]: m.metric_fitness_index(),
};
