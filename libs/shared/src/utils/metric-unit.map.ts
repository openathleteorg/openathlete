import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';

/**
 * Map of metric types to their units
 */
export const metricUnitMap: Record<METRIC_TYPE, string> = {
  [METRIC_TYPE.WEIGHT]: 'kg',
  [METRIC_TYPE.HEIGHT]: 'cm',
  [METRIC_TYPE.BMI]: 'kg/m²',
  [METRIC_TYPE.BODY_FAT]: '%',
  [METRIC_TYPE.MUSCLE_MASS]: 'kg',
  [METRIC_TYPE.DAILY_CALORIES]: 'kcal',
  [METRIC_TYPE.DAILY_STEPS]: 'steps',
  [METRIC_TYPE.SLEEP_DURATION]: 'h',
  [METRIC_TYPE.SLEEP_SCORE]: '/100',
  [METRIC_TYPE.HOOPER_INDEX]: '/10',

  [METRIC_TYPE.HR_MAX]: 'bpm',
  [METRIC_TYPE.HR_REST]: 'bpm',
  [METRIC_TYPE.HR_RESERVE]: 'bpm',
  [METRIC_TYPE.RMSSD]: 'ms',

  [METRIC_TYPE.VMA]: 'km/h',
  [METRIC_TYPE.CRITICAL_POWER_RUNNING]: 'W/kg',
  [METRIC_TYPE.CRITICAL_POWER_CYCLING]: 'W',
  [METRIC_TYPE.VO2MAX]: 'ml/kg/min',
  [METRIC_TYPE.FTP_RUNNING]: 'W/kg',
  [METRIC_TYPE.FTP_CYCLING]: 'W',
  [METRIC_TYPE.VERTICAL_SPEED_AVG]: 'm/h',
  [METRIC_TYPE.VERTICAL_SPEED_MAX]: 'm/h',
  [METRIC_TYPE.FITNESS_INDEX]: '/100',
};
