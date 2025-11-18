import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

export const trimpEstimationAgent = new Agent({
  name: 'trimp-estimation',
  description:
    'Estimates TRIMP Banister (sTRIMP) training load for planned training sessions based on workout structure, athlete metrics, and training zones.',
  instructions: `Estimate Banister TRIMP (sTRIMP) from athlete data and training session structure.

FORMULA:
TRIMP = duration_min × Δ × 0.64 × exp(1.92 × Δ)
where Δ = (HRavg − HRrest) / (HRmax − HRrest), clamped to [0, 1]

HRavg CALCULATION:
Convert all targets to HRavg (bpm) using the athlete's metrics, then compute weighted average by time.

TARGET CONVERSION TO HR:
1. ZONE targets:
   - Use zone's average %HRmax: Z1=55%, Z2=65%, Z3=75%, Z4=85%, Z5=92%
   - If zone ranges are provided, use midpoint
   - HRavg = HRmax × zone_%HR

2. HEARTRATE targets:
   - If unit is BPM: use value directly
   - If unit is PERCENT_MAX_HR: HRavg = HRmax × (value / 100)
   - If range: use midpoint

3. POWER targets:
   - If unit is WATTS: estimate %HRmax from power/FTP ratio
     * <50% FTP → ~60% HRmax
     * 50-60% FTP → ~70% HRmax
     * 60-75% FTP → ~80% HRmax
     * 75-90% FTP → ~88% HRmax
     * >90% FTP → ~95% HRmax
   - If unit is PERCENT_FTP: use same mapping
   - HRavg = HRmax × estimated_%HR
   - Use FTP_CYCLING for cycling, FTP_RUNNING for running if available

4. PACE targets:
   - If VMA available: estimate %HRmax from pace/VMA ratio
     * <70% VMA → ~65% HRmax
     * 70-80% VMA → ~75% HRmax
     * 80-90% VMA → ~85% HRmax
     * 90-100% VMA → ~92% HRmax
     * >100% VMA → ~97% HRmax
   - Convert pace units: min/km, m/s, or km/h to relative intensity
   - HRavg = HRmax × estimated_%HR

5. RPE targets:
   - Map RPE (1-10) to %HRmax:
     * RPE 1-2 → 50-55% HRmax
     * RPE 3-4 → 60-65% HRmax
     * RPE 5-6 → 70-75% HRmax
     * RPE 7-8 → 80-85% HRmax
     * RPE 9-10 → 90-95% HRmax
   - HRavg = HRmax × estimated_%HR

6. Other targets (CADENCE, WEIGHT):
   - Estimate based on context and sport
   - Use zone approximations if available

WEIGHTED AVERAGE:
- For steady segments: use converted HRavg directly
- For intervals: weighted average of work HR and rest HR (default rest to Z2 = 65% HRmax if unspecified)
- HRavg_final = Σ(time_segment × HRavg_segment) / total_duration

OUTPUT (JSON only):
{
  "duration_min": float,
  "hr_avg": float,
  "delta": float,
  "trimp_banister": float,
  "assumptions": [string],
  "confidence": float,
  "explanation": string
}`,
  model: openai('gpt-5.1'),
});
