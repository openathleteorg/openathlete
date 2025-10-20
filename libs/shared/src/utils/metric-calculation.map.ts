import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';

/**
 * Metric calculation configuration
 * Defines which metrics can be auto-calculated and their dependencies
 */
export type MetricCalculation = {
  canAutoCalculate: boolean;
  dependencies?: METRIC_TYPE[];
  calculate?: (values: Record<METRIC_TYPE, number>) => number;
};

/**
 * Map of metric types to their calculation configuration
 */
export const metricCalculationMap: Record<METRIC_TYPE, MetricCalculation> = {
  [METRIC_TYPE.WEIGHT]: { canAutoCalculate: false },
  [METRIC_TYPE.HEIGHT]: { canAutoCalculate: false },
  [METRIC_TYPE.BMI]: {
    canAutoCalculate: true,
    dependencies: [METRIC_TYPE.WEIGHT, METRIC_TYPE.HEIGHT],
    calculate: (values) => {
      const weight = values[METRIC_TYPE.WEIGHT];
      const height = values[METRIC_TYPE.HEIGHT] / 100; // Convert cm to m
      return Math.round((weight / (height * height)) * 100) / 100;
    },
  },
  [METRIC_TYPE.BODY_FAT]: { canAutoCalculate: false },
  [METRIC_TYPE.MUSCLE_MASS]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_CALORIES]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_STEPS]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_SCORE]: { canAutoCalculate: false },
  [METRIC_TYPE.HOOPER_INDEX]: { canAutoCalculate: false },

  [METRIC_TYPE.HR_MAX]: { canAutoCalculate: false },
  [METRIC_TYPE.HR_REST]: { canAutoCalculate: false },
  [METRIC_TYPE.HR_RESERVE]: {
    canAutoCalculate: true,
    dependencies: [METRIC_TYPE.HR_MAX, METRIC_TYPE.HR_REST],
    calculate: (values) => {
      return values[METRIC_TYPE.HR_MAX] - values[METRIC_TYPE.HR_REST];
    },
  },
  [METRIC_TYPE.RMSSD]: { canAutoCalculate: false },

  [METRIC_TYPE.VMA]: { canAutoCalculate: false },
  [METRIC_TYPE.CRITICAL_POWER_RUNNING]: { canAutoCalculate: false },
  [METRIC_TYPE.CRITICAL_POWER_CYCLING]: { canAutoCalculate: false },
  [METRIC_TYPE.VO2MAX]: { canAutoCalculate: false },
  [METRIC_TYPE.FTP_RUNNING]: { canAutoCalculate: false },
  [METRIC_TYPE.FTP_CYCLING]: { canAutoCalculate: false },
  [METRIC_TYPE.VERTICAL_SPEED_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.VERTICAL_SPEED_MAX]: { canAutoCalculate: false },
  [METRIC_TYPE.FITNESS_INDEX]: { canAutoCalculate: false },
};
