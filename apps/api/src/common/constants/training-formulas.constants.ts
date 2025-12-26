/**
 * Training Formulas and Physics Constants
 *
 * This file contains all mathematical constants and formulas used in training load calculations,
 * with scientific references and explanations.
 *
 * References:
 * - Bannister, E. W. (1991). Modeling elite athletic performance.
 * - Edwards, S. (1993). The heart rate monitor book.
 * - Foster, C. et al. (2001). A new approach to monitoring exercise training.
 */

// ============================================================================
// TRIMP (Training Impulse) Formula Constants
// ============================================================================

/**
 * TRIMP exponential weighting coefficient for males
 *
 * Source: Bannister's impulse-response model (Bannister, 1991)
 * Formula: TRIMP = duration_min × Δ × y × exp(k × Δ)
 * where Δ = (HRavg − HRrest) / (HRmax − HRrest)
 *
 * The coefficient k determines the exponential weighting of heart rate intensity.
 * Higher values increase the weight of high-intensity efforts.
 */
export const TRIMP_COEFFICIENT_K_MALE = 1.92;

/**
 * TRIMP exponential weighting coefficient for females
 *
 * Source: Bannister's impulse-response model, adapted for female athletes
 * Female athletes typically have different cardiovascular responses, requiring
 * a lower exponential coefficient (1.67 vs 1.92 for males).
 */
export const TRIMP_COEFFICIENT_K_FEMALE = 1.67;

/**
 * TRIMP linear scaling coefficient for males
 *
 * Source: Bannister's impulse-response model (Bannister, 1991)
 * This coefficient scales the base TRIMP value in the formula.
 */
export const TRIMP_COEFFICIENT_Y_MALE = 0.64;

/**
 * TRIMP linear scaling coefficient for females
 *
 * Source: Bannister's impulse-response model, adapted for female athletes
 * Female athletes use a higher linear coefficient (0.86 vs 0.64 for males).
 */
export const TRIMP_COEFFICIENT_Y_FEMALE = 0.86;

// ============================================================================
// Exponentially Weighted Moving Average (EWMA) Constants
// ============================================================================

/**
 * Alpha coefficient for Acute Training Load (ATL) calculation
 *
 * ATL represents the 7-day exponentially weighted moving average of training load.
 * Formula: alpha = 2 / (period + 1) where period = 7 days
 * This gives more weight to recent training while still considering the full week.
 *
 * Source: TrainingPeaks methodology, based on Banister's impulse-response model
 */
export const EWMA_ALPHA_ATL = 2 / 8; // 7-day EWMA

/**
 * Alpha coefficient for Chronic Training Load (CTL) calculation
 *
 * CTL represents the 42-day exponentially weighted moving average of training load.
 * Formula: alpha = 2 / (period + 1) where period = 42 days
 * This provides a long-term fitness indicator that responds slowly to changes.
 *
 * Source: TrainingPeaks methodology, based on Banister's impulse-response model
 */
export const EWMA_ALPHA_CTL = 2 / 43; // 42-day EWMA

// ============================================================================
// Training Stress Balance (TSB) Thresholds
// ============================================================================

/**
 * TSB threshold for overreaching status
 *
 * When TSB (CTL - ATL) is below this value, the athlete is considered overreaching.
 * Negative TSB indicates fatigue accumulation from recent high training loads.
 *
 * Source: TrainingPeaks methodology
 */
export const TSB_OVERREACHING_THRESHOLD = -10;

/**
 * TSB threshold for detraining status
 *
 * When TSB (CTL - ATL) is above this value, the athlete is considered detraining.
 * High positive TSB indicates low recent training relative to fitness baseline.
 *
 * Source: TrainingPeaks methodology
 */
export const TSB_DETRAINING_THRESHOLD = 25;

// ============================================================================
// Acute:Chronic Workload Ratio (ACWR) Thresholds
// ============================================================================

/**
 * ACWR threshold for safe/underconditioned status
 *
 * ACWR < 0.8 indicates the athlete is underconditioned or in a safe zone.
 * This suggests recent training load is lower than chronic load.
 *
 * Source: Gabbett, T. J. (2016). The training-injury prevention paradox.
 */
export const ACWR_SAFE_THRESHOLD = 0.8;

/**
 * ACWR threshold for optimal training zone
 *
 * ACWR between 0.8 and 1.3 is considered the optimal training zone,
 * balancing training stimulus with injury risk.
 *
 * Source: Gabbett, T. J. (2016). The training-injury prevention paradox.
 */
export const ACWR_OPTIMAL_MAX = 1.3;

/**
 * ACWR threshold for moderate injury risk
 *
 * ACWR between 1.3 and 1.5 indicates moderate injury risk.
 * Training load recommendations should be reduced by 10% in this zone.
 *
 * Source: Gabbett, T. J. (2016). The training-injury prevention paradox.
 */
export const ACWR_MODERATE_RISK_THRESHOLD = 1.5;

/**
 * ACWR threshold for high injury risk
 *
 * ACWR > 1.5 indicates high injury risk.
 * Training load recommendations should be reduced by 20% in this zone.
 *
 * Source: Gabbett, T. J. (2016). The training-injury prevention paradox.
 */
export const ACWR_HIGH_RISK_THRESHOLD = 1.5;

// ============================================================================
// Training Zone Percentages (%HRmax)
// ============================================================================

/**
 * Training zone percentages as percentage of maximum heart rate
 *
 * These represent the average %HRmax for each training zone:
 * - Z1: Recovery/Easy (55%)
 * - Z2: Aerobic/Endurance (65%)
 * - Z3: Tempo/Moderate (75%)
 * - Z4: Threshold/Hard (85%)
 * - Z5: VO2max/Very Hard (92%)
 *
 * Source: Standard training zone definitions (Edwards, 1993)
 */
export const TRAINING_ZONE_PERCENTAGES = {
  Z1: 0.55, // 55% HRmax
  Z2: 0.65, // 65% HRmax
  Z3: 0.75, // 75% HRmax
  Z4: 0.85, // 85% HRmax
  Z5: 0.92, // 92% HRmax
} as const;

/**
 * Default rest zone percentage
 *
 * When rest intervals are not specified, default to Z2 (65% HRmax)
 * as a typical active recovery intensity.
 */
export const DEFAULT_REST_ZONE_PERCENTAGE = TRAINING_ZONE_PERCENTAGES.Z2;

// ============================================================================
// Default Metric Values (Population Averages)
// ============================================================================

/**
 * Default maximum heart rate (bpm)
 *
 * Average HRmax for adult population when athlete-specific value is unavailable.
 * Note: HRmax varies significantly by age and individual, but 190 bpm is a
 * reasonable population average.
 */
export const DEFAULT_HR_MAX = 190; // bpm

/**
 * Default resting heart rate (bpm)
 *
 * Average HRrest for adult population when athlete-specific value is unavailable.
 * Typical range: 60-100 bpm for adults, 60 bpm represents a fit individual.
 */
export const DEFAULT_HR_REST = 60; // bpm

/**
 * Default heart rate reserve (bpm)
 *
 * Average HR reserve (HRmax - HRrest) when athlete-specific value is unavailable.
 * Calculated as: 190 - 60 = 130 bpm
 */
export const DEFAULT_HR_RESERVE = 130; // bpm

/**
 * Default Functional Threshold Power for running (W)
 *
 * Average FTP for running when athlete-specific value is unavailable.
 * Typical range: 200-350W depending on athlete fitness level.
 */
export const DEFAULT_FTP_RUNNING = 275; // W

/**
 * Default Functional Threshold Power for cycling (W)
 *
 * Average FTP for cycling when athlete-specific value is unavailable.
 * Typically lower than running FTP due to different muscle recruitment.
 */
export const DEFAULT_FTP_CYCLING = 225; // W

/**
 * Default Velocity at Maximal Aerobic Speed (VMA) (km/h)
 *
 * Average VMA when athlete-specific value is unavailable.
 * 15 km/h corresponds to approximately 4:00 min/km pace.
 * Typical range: 12-20 km/h depending on athlete fitness level.
 */
export const DEFAULT_VMA_KMH = 15.0; // km/h

/**
 * Conversion factor from km/h to m/s
 *
 * Used to convert pace values: 1 km/h = 1000 m / 3600 s = 1/3.6 m/s
 */
export const KMH_TO_MS = 1 / 3.6;

// ============================================================================
// Power to Heart Rate Conversion
// ============================================================================

/**
 * Power-to-HR conversion thresholds and percentages
 *
 * Maps power output (as % of FTP) to estimated %HRmax.
 * Based on typical cardiovascular response to power output.
 *
 * Source: Empirical observations from training data analysis
 */
export const POWER_TO_HR_CONVERSION = {
  // Thresholds (as % of FTP)
  THRESHOLDS: {
    LOW: 0.5, // <50% FTP
    MODERATE: 0.6, // 50-60% FTP
    HIGH: 0.75, // 60-75% FTP
    VERY_HIGH: 0.9, // 75-90% FTP
    MAXIMAL: 0.9, // >90% FTP
  },
  // Corresponding %HRmax estimates
  HR_PERCENTAGES: {
    LOW: 0.6, // ~60% HRmax for <50% FTP
    MODERATE: 0.7, // ~70% HRmax for 50-60% FTP
    HIGH: 0.8, // ~80% HRmax for 60-75% FTP
    VERY_HIGH: 0.88, // ~88% HRmax for 75-90% FTP
    MAXIMAL: 0.95, // ~95% HRmax for >90% FTP
  },
} as const;

// ============================================================================
// Pace to Heart Rate Conversion
// ============================================================================

/**
 * Pace-to-HR conversion thresholds and percentages
 *
 * Maps pace (as % of VMA) to estimated %HRmax.
 * Based on typical cardiovascular response to running pace.
 *
 * Source: Empirical observations from training data analysis
 */
export const PACE_TO_HR_CONVERSION = {
  // Thresholds (as % of VMA)
  THRESHOLDS: {
    LOW: 0.7, // <70% VMA
    MODERATE: 0.8, // 70-80% VMA
    HIGH: 0.9, // 80-90% VMA
    VERY_HIGH: 1.0, // 90-100% VMA
    MAXIMAL: 1.0, // >100% VMA
  },
  // Corresponding %HRmax estimates
  HR_PERCENTAGES: {
    LOW: 0.65, // ~65% HRmax for <70% VMA
    MODERATE: 0.75, // ~75% HRmax for 70-80% VMA
    HIGH: 0.85, // ~85% HRmax for 80-90% VMA
    VERY_HIGH: 0.92, // ~92% HRmax for 90-100% VMA
    MAXIMAL: 0.97, // ~97% HRmax for >100% VMA
  },
} as const;

// ============================================================================
// RPE (Rate of Perceived Exertion) to Heart Rate Conversion
// ============================================================================

/**
 * RPE-to-HR conversion mappings
 *
 * Maps RPE scale (1-10) to estimated %HRmax ranges.
 * Based on Borg's RPE scale and typical HR responses.
 *
 * Source: Borg, G. A. (1982). Psychophysical bases of perceived exertion.
 */
export const RPE_TO_HR_CONVERSION = {
  RPE_1_2: { min: 0.5, max: 0.55 }, // 50-55% HRmax
  RPE_3_4: { min: 0.6, max: 0.65 }, // 60-65% HRmax
  RPE_5_6: { min: 0.7, max: 0.75 }, // 70-75% HRmax
  RPE_7_8: { min: 0.8, max: 0.85 }, // 80-85% HRmax
  RPE_9_10: { min: 0.9, max: 0.95 }, // 90-95% HRmax
} as const;

// ============================================================================
// Training Load Recommendation Constants
// ============================================================================

/**
 * Load slope clamping values
 *
 * Limits the rate of change in training load recommendations to prevent
 * sudden increases that could lead to injury.
 *
 * Source: Training load progression best practices
 */
export const LOAD_SLOPE_CLAMP = {
  MIN: -0.2, // Maximum 20% decrease per week
  MAX: 0.2, // Maximum 20% increase per week
} as const;

/**
 * Base recommendation ratios
 *
 * Base ratios for calculating recommended training load ranges.
 * These are adjusted based on training history and ACWR.
 *
 * Source: Training load progression best practices
 */
export const RECOMMENDATION_BASE_RATIOS = {
  MIN: 0.75, // Base minimum ratio (75% of baseline)
  MAX: 1.3, // Base maximum ratio (130% of baseline)
  ABS_MIN: 0.7, // Absolute minimum ratio (70% of baseline)
  ABS_MAX: 1.4, // Absolute maximum ratio (140% of baseline)
} as const;

/**
 * Recommendation adjustment multipliers
 *
 * Used to adjust base recommendations based on training trends.
 */
export const RECOMMENDATION_ADJUSTMENTS = {
  SLOPE_MULTIPLIER: 0.5, // Multiplier for slope-based adjustments
  SAFE_MIN_OFFSET: 0.1, // Minimum offset between min and max
  ANCHOR_BLEND: 0.5, // Blend factor for anchoring to current load
  ZERO_WEEK_DECAY: 0.5, // Decay factor for weeks with zero load
  SHORTFALL_DECAY: 0.3, // Decay factor when load is below recommendation
  ZERO_WEEK_SHORTFALL_DECAY: 0.5, // Decay factor for zero-load weeks
  TREND_CLAMP_MIN: 0.6, // Minimum trend ratio
  TREND_CLAMP_MAX: 1.4, // Maximum trend ratio
  TREND_WEIGHT: 0.6, // Weight for trend-based adjustments
} as const;

/**
 * ACWR-based recommendation adjustments
 *
 * Multipliers applied to recommendations based on ACWR status.
 * Higher ACWR (injury risk) leads to reduced recommendations.
 */
export const ACWR_RECOMMENDATION_ADJUSTMENTS = {
  HIGH_RISK_MULTIPLIER: 0.8, // Reduce by 20% when ACWR > 1.5
  MODERATE_RISK_MULTIPLIER: 0.9, // Reduce by 10% when ACWR > 1.3
  SAFE_PROGRESSION_MULTIPLIER: 1.05, // Allow 5% more when ACWR < 0.8
} as const;

/**
 * Current load anchoring factors
 *
 * Used to anchor recommendations to current training load when available.
 */
export const CURRENT_LOAD_ANCHORING = {
  MIN_FACTOR: 0.85, // Anchor minimum to 85% of current load
  MAX_FACTOR: 1.15, // Anchor maximum to 115% of current load
} as const;
