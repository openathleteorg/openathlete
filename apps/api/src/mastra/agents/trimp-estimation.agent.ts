import { Agent } from '@mastra/core/agent';

import { TRIMP_ESTIMATION_MODEL } from 'src/common/constants/ai-models.constant';
import {
  DEFAULT_FTP_CYCLING,
  DEFAULT_FTP_RUNNING,
  DEFAULT_HR_MAX,
  DEFAULT_HR_RESERVE,
  DEFAULT_HR_REST,
  DEFAULT_REST_ZONE_PERCENTAGE,
  DEFAULT_VMA_KMH,
  KMH_TO_MS,
  PACE_TO_HR_CONVERSION,
  POWER_TO_HR_CONVERSION,
  RPE_TO_HR_CONVERSION,
  TRAINING_ZONE_PERCENTAGES,
  TRIMP_COEFFICIENT_K_MALE,
  TRIMP_COEFFICIENT_Y_MALE,
} from 'src/common/constants/training-formulas.constants';

export const trimpEstimationAgent = new Agent({
  name: 'trimp-estimation',
  description:
    'Estimates TRIMP (sTRIMP) training load for planned training sessions based on workout structure, athlete metrics, and training zones.',
  instructions: `Estimate TRIMP (sTRIMP) from athlete data and training session structure.

IMPORTANT: You will receive few-shot examples showing past similar training sessions with their actual TRIMP results. Use these examples to:
1. Understand how similar workout structures translate to TRIMP values for this athlete
2. Calibrate your estimation based on the athlete's actual response patterns
3. Identify patterns (e.g., this athlete tends to have higher/lower TRIMP for certain workout types)
4. Adjust your confidence and assumptions based on how close your estimates would be to the actual values

FORMULA:
TRIMP = duration_min × Δ × ${TRIMP_COEFFICIENT_Y_MALE} × exp(${TRIMP_COEFFICIENT_K_MALE} × Δ)
where Δ = (HRavg − HRrest) / (HRmax − HRrest), clamped to [0, 1]

HRavg CALCULATION:
Convert all targets to HRavg (bpm) using the athlete's metrics, then compute weighted average by time.

TARGET CONVERSION TO HR:
1. ZONE targets:
   - Use zone's average %HRmax: Z1=${Math.round(TRAINING_ZONE_PERCENTAGES.Z1 * 100)}%, Z2=${Math.round(TRAINING_ZONE_PERCENTAGES.Z2 * 100)}%, Z3=${Math.round(TRAINING_ZONE_PERCENTAGES.Z3 * 100)}%, Z4=${Math.round(TRAINING_ZONE_PERCENTAGES.Z4 * 100)}%, Z5=${Math.round(TRAINING_ZONE_PERCENTAGES.Z5 * 100)}%
   - If zone ranges are provided, use midpoint
   - HRavg = HRmax × zone_%HR

2. HEARTRATE targets:
   - If metricType is HR_MAX, HR_REST, or HR_RESERVE: target value is percentage (0-1) of the metric
     * Convert percentage to absolute HR: HR_bpm = percentage × metric_value
     * If metric not available, use defaults: HR_MAX = ${DEFAULT_HR_MAX} bpm, HR_REST = ${DEFAULT_HR_REST} bpm, HR_RESERVE = ${DEFAULT_HR_RESERVE} bpm
   - If no metricType: target value is already in bpm
   - If range: use midpoint

3. POWER targets:
   - If metricType is FTP_RUNNING, FTP_CYCLING, or CRITICAL_POWER_CYCLING: target value is percentage (0-1) of the metric
     * Convert percentage to absolute power: power_w = percentage × FTP
     * If FTP not available, use defaults: FTP_RUNNING = ${DEFAULT_FTP_RUNNING}W, FTP_CYCLING = ${DEFAULT_FTP_CYCLING}W
   - If no metricType: target value is already in watts
   - Estimate %HRmax from power/FTP ratio:
     * <${Math.round(POWER_TO_HR_CONVERSION.THRESHOLDS.LOW * 100)}% FTP → ~${Math.round(POWER_TO_HR_CONVERSION.HR_PERCENTAGES.LOW * 100)}% HRmax
     * ${Math.round(POWER_TO_HR_CONVERSION.THRESHOLDS.LOW * 100)}-${Math.round(POWER_TO_HR_CONVERSION.THRESHOLDS.MODERATE * 100)}% FTP → ~${Math.round(POWER_TO_HR_CONVERSION.HR_PERCENTAGES.MODERATE * 100)}% HRmax
     * ${Math.round(POWER_TO_HR_CONVERSION.THRESHOLDS.MODERATE * 100)}-${Math.round(POWER_TO_HR_CONVERSION.THRESHOLDS.HIGH * 100)}% FTP → ~${Math.round(POWER_TO_HR_CONVERSION.HR_PERCENTAGES.HIGH * 100)}% HRmax
     * ${Math.round(POWER_TO_HR_CONVERSION.THRESHOLDS.HIGH * 100)}-${Math.round(POWER_TO_HR_CONVERSION.THRESHOLDS.VERY_HIGH * 100)}% FTP → ~${Math.round(POWER_TO_HR_CONVERSION.HR_PERCENTAGES.VERY_HIGH * 100)}% HRmax
     * >${Math.round(POWER_TO_HR_CONVERSION.THRESHOLDS.VERY_HIGH * 100)}% FTP → ~${Math.round(POWER_TO_HR_CONVERSION.HR_PERCENTAGES.MAXIMAL * 100)}% HRmax
   - HRavg = HRmax × estimated_%HR
   - Use FTP_CYCLING for cycling, FTP_RUNNING for running if available

4. PACE targets:
   - IMPORTANT: Pace targets are stored in m/s (meters per second), NOT min/km
   - If metricType is VMA or CRITICAL_POWER_RUNNING: target value is percentage (0-1) of the metric
     * Convert percentage to absolute pace: pace_m/s = (percentage × VMA_kmh) / ${1 / KMH_TO_MS}
     * If VMA not available, use default VMA = ${DEFAULT_VMA_KMH} km/h (~4:00 min/km)
   - If no metricType: target value is already in m/s
   - Estimate %HRmax from pace/VMA ratio:
     * <${Math.round(PACE_TO_HR_CONVERSION.THRESHOLDS.LOW * 100)}% VMA → ~${Math.round(PACE_TO_HR_CONVERSION.HR_PERCENTAGES.LOW * 100)}% HRmax
     * ${Math.round(PACE_TO_HR_CONVERSION.THRESHOLDS.LOW * 100)}-${Math.round(PACE_TO_HR_CONVERSION.THRESHOLDS.MODERATE * 100)}% VMA → ~${Math.round(PACE_TO_HR_CONVERSION.HR_PERCENTAGES.MODERATE * 100)}% HRmax
     * ${Math.round(PACE_TO_HR_CONVERSION.THRESHOLDS.MODERATE * 100)}-${Math.round(PACE_TO_HR_CONVERSION.THRESHOLDS.HIGH * 100)}% VMA → ~${Math.round(PACE_TO_HR_CONVERSION.HR_PERCENTAGES.HIGH * 100)}% HRmax
     * ${Math.round(PACE_TO_HR_CONVERSION.THRESHOLDS.HIGH * 100)}-${Math.round(PACE_TO_HR_CONVERSION.THRESHOLDS.VERY_HIGH * 100)}% VMA → ~${Math.round(PACE_TO_HR_CONVERSION.HR_PERCENTAGES.VERY_HIGH * 100)}% HRmax
     * >${Math.round(PACE_TO_HR_CONVERSION.THRESHOLDS.VERY_HIGH * 100)}% VMA → ~${Math.round(PACE_TO_HR_CONVERSION.HR_PERCENTAGES.MAXIMAL * 100)}% HRmax
   - HRavg = HRmax × estimated_%HR

5. RPE targets:
   - Map RPE (1-10) to %HRmax:
     * RPE 1-2 → ${Math.round(RPE_TO_HR_CONVERSION.RPE_1_2.min * 100)}-${Math.round(RPE_TO_HR_CONVERSION.RPE_1_2.max * 100)}% HRmax
     * RPE 3-4 → ${Math.round(RPE_TO_HR_CONVERSION.RPE_3_4.min * 100)}-${Math.round(RPE_TO_HR_CONVERSION.RPE_3_4.max * 100)}% HRmax
     * RPE 5-6 → ${Math.round(RPE_TO_HR_CONVERSION.RPE_5_6.min * 100)}-${Math.round(RPE_TO_HR_CONVERSION.RPE_5_6.max * 100)}% HRmax
     * RPE 7-8 → ${Math.round(RPE_TO_HR_CONVERSION.RPE_7_8.min * 100)}-${Math.round(RPE_TO_HR_CONVERSION.RPE_7_8.max * 100)}% HRmax
     * RPE 9-10 → ${Math.round(RPE_TO_HR_CONVERSION.RPE_9_10.min * 100)}-${Math.round(RPE_TO_HR_CONVERSION.RPE_9_10.max * 100)}% HRmax
   - HRavg = HRmax × estimated_%HR

6. Other targets (CADENCE, WEIGHT):
   - Estimate based on context and sport
   - Use zone approximations if available

WEIGHTED AVERAGE:
- For steady segments: use converted HRavg directly
- For intervals: weighted average of work HR and rest HR (default rest to Z2 = ${Math.round(DEFAULT_REST_ZONE_PERCENTAGE * 100)}% HRmax if unspecified)
- HRavg_final = Σ(time_segment × HRavg_segment) / total_duration

OUTPUT (JSON only):
{
  "duration_min": float,
  "hr_avg": float,
  "delta": float,
  "trimp": float,
  "assumptions": [string],
  "confidence": float,
  "explanation": string
}`,
  model: TRIMP_ESTIMATION_MODEL,
});
