import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';

/**
 * Metric calculation configuration
 * Defines which metrics can be auto-calculated and their dependencies
 */
export type MetricCalculation =
  | {
      canAutoCalculate: true;
      dependencies: METRIC_TYPE[];
      calculate: (values: Partial<Record<METRIC_TYPE, number>>) => number;
    }
  | {
      canAutoCalculate: false;
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
      const weight = values[METRIC_TYPE.WEIGHT]!;
      const height = values[METRIC_TYPE.HEIGHT]! / 100; // Convert cm to m
      return Math.round((weight / (height * height)) * 100) / 100;
    },
  },
  [METRIC_TYPE.BODY_FAT]: { canAutoCalculate: false },
  [METRIC_TYPE.MUSCLE_MASS]: { canAutoCalculate: false },
  [METRIC_TYPE.BONE_MASS]: { canAutoCalculate: false },
  [METRIC_TYPE.BODY_WATER]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_CALORIES]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_ACTIVE_CALORIES]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_BMR_CALORIES]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_STEPS]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_DISTANCE]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_ACTIVE_MINUTES]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_MODERATE_MINUTES]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_VIGOROUS_MINUTES]: { canAutoCalculate: false },
  [METRIC_TYPE.DAILY_FLOORS]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_SCORE]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_REM_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_DEEP_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_LIGHT_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_AWAKE_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_RESPIRATION_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.SLEEP_SPO2_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.NAP_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.HOOPER_INDEX]: { canAutoCalculate: false },

  [METRIC_TYPE.HR_MAX]: { canAutoCalculate: false },
  [METRIC_TYPE.HR_REST]: { canAutoCalculate: false },
  [METRIC_TYPE.HR_MIN_DAILY]: { canAutoCalculate: false },
  [METRIC_TYPE.HR_AVG_DAILY]: { canAutoCalculate: false },
  [METRIC_TYPE.HR_MAX_DAILY]: { canAutoCalculate: false },
  [METRIC_TYPE.HR_RESERVE]: {
    canAutoCalculate: true,
    dependencies: [METRIC_TYPE.HR_MAX, METRIC_TYPE.HR_REST],
    calculate: (values) =>
      values[METRIC_TYPE.HR_MAX]! - values[METRIC_TYPE.HR_REST]!,
  },
  [METRIC_TYPE.RMSSD]: { canAutoCalculate: false },
  [METRIC_TYPE.HRV_LAST_NIGHT_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.HRV_LAST_NIGHT_5MIN_HIGH]: { canAutoCalculate: false },
  [METRIC_TYPE.SNAPSHOT_HEART_RATE_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.SNAPSHOT_STRESS_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.SNAPSHOT_RESPIRATION_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.SNAPSHOT_SPO2_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.SNAPSHOT_SDNN]: { canAutoCalculate: false },
  [METRIC_TYPE.SNAPSHOT_RMSSD]: { canAutoCalculate: false },
  [METRIC_TYPE.RESPIRATION_RATE_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.PULSE_OX_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.PULSE_OX_MIN]: { canAutoCalculate: false },
  [METRIC_TYPE.BLOOD_PRESSURE_SYSTOLIC]: { canAutoCalculate: false },
  [METRIC_TYPE.BLOOD_PRESSURE_DIASTOLIC]: { canAutoCalculate: false },
  [METRIC_TYPE.BLOOD_PRESSURE_PULSE]: { canAutoCalculate: false },
  [METRIC_TYPE.STRESS_AVERAGE]: { canAutoCalculate: false },
  [METRIC_TYPE.STRESS_MAX]: { canAutoCalculate: false },
  [METRIC_TYPE.STRESS_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.STRESS_REST_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.STRESS_ACTIVITY_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.STRESS_LOW_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.STRESS_MEDIUM_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.STRESS_HIGH_DURATION]: { canAutoCalculate: false },
  [METRIC_TYPE.BODY_BATTERY_CHARGED]: { canAutoCalculate: false },
  [METRIC_TYPE.BODY_BATTERY_DRAINED]: { canAutoCalculate: false },
  [METRIC_TYPE.SKIN_TEMP_DEVIATION]: { canAutoCalculate: false },

  [METRIC_TYPE.VMA]: { canAutoCalculate: false },
  [METRIC_TYPE.CRITICAL_POWER_RUNNING]: { canAutoCalculate: false },
  [METRIC_TYPE.CRITICAL_POWER_CYCLING]: { canAutoCalculate: false },
  [METRIC_TYPE.VO2MAX]: { canAutoCalculate: false },
  [METRIC_TYPE.VO2MAX_CYCLING]: { canAutoCalculate: false },
  [METRIC_TYPE.FTP_RUNNING]: { canAutoCalculate: false },
  [METRIC_TYPE.FTP_CYCLING]: { canAutoCalculate: false },
  [METRIC_TYPE.VERTICAL_SPEED_AVG]: { canAutoCalculate: false },
  [METRIC_TYPE.VERTICAL_SPEED_MAX]: { canAutoCalculate: false },
  [METRIC_TYPE.FITNESS_INDEX]: { canAutoCalculate: false },
  [METRIC_TYPE.FITNESS_AGE]: { canAutoCalculate: false },
};
