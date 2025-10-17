import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * Validate Training Plan Tool
 *
 * Purpose: Validate a complete training plan against evidence-based training principles,
 * safety constraints, and athlete-specific limitations.
 *
 * This tool implements deterministic validation rules to ensure:
 * - Safe load progression (no sudden volume spikes)
 * - Adequate recovery (rest days, recovery weeks)
 * - Proper hard session spacing (no back-to-back hard days)
 * - Balanced intensity distribution (80/20 rule)
 * - Sessions fit within athlete's availability windows
 * - Race-specific preparation adequacy
 *
 * Validation Rules:
 * 1. LOAD PROGRESSION (CRITICAL): Weekly volume increase ≤ 10-15%
 * 2. RECOVERY ADEQUACY (CRITICAL): At least 1 rest day per week
 * 3. HARD SESSION SPACING (CRITICAL): No hard sessions within 24h
 * 4. INTENSITY DISTRIBUTION (WARNING): ~80% easy volume, ~20% hard
 * 5. SESSION DURATION (CRITICAL): Sessions fit within availability windows
 * 6. RACE PREPARATION (INFO): Long runs reach 70-80% of race distance
 * 7. TAPER VALIDATION (WARNING): Volume reduces 40-60% in taper weeks
 * 8. OVERALL BALANCE (INFO): Smooth progression, variety, appropriate duration
 *
 * Used by:
 * - qa.agent: Primary use for plan validation
 * - plan-generation.workflow: Final QA step before persistence
 *
 * Note: This tool contains pure TypeScript logic - no external API calls.
 * The LLM interprets results and provides narrative feedback.
 */

// ============================================================================
// VALIDATION CONSTANTS (Configurable)
// ============================================================================

const VALIDATION_CONSTANTS = {
  // Hard session threshold: sessions with RPE > this value are considered "hard"
  HARD_SESSION_RPE_THRESHOLD: 0.7,

  // Load progression limits
  MAX_WEEKLY_VOLUME_INCREASE_PERCENT: 15, // CRITICAL threshold
  WARNING_WEEKLY_VOLUME_INCREASE_PERCENT: 10, // WARNING threshold

  // Recovery requirements
  MIN_REST_DAYS_PER_WEEK: 1,
  RECOVERY_WEEK_FREQUENCY: 4, // Every N weeks should be a recovery week
  RECOVERY_WEEK_VOLUME_REDUCTION_MIN: 20, // Minimum % reduction
  RECOVERY_WEEK_VOLUME_REDUCTION_MAX: 40, // Maximum % reduction

  // Hard session spacing
  MIN_HOURS_BETWEEN_HARD_SESSIONS: 24,

  // Intensity distribution (80/20 rule)
  TARGET_EASY_VOLUME_PERCENT: 80,
  WARNING_HARD_VOLUME_PERCENT: 25, // Warning if >25% hard
  CRITICAL_HARD_VOLUME_PERCENT: 30, // Critical if >30% hard

  // Race preparation
  LONG_RUN_TARGET_PERCENT_OF_RACE: 70, // Should reach 70-80% of race distance
  LONG_RUN_WARNING_PERCENT_OF_RACE: 60,
  LONG_RUN_CRITICAL_PERCENT_OF_RACE: 50,

  // Taper validation
  TAPER_VOLUME_REDUCTION_MIN: 40, // Minimum % reduction from peak
  TAPER_VOLUME_REDUCTION_MAX: 60, // Maximum % reduction from peak
  TAPER_WARNING_REDUCTION_MIN: 30,

  // Scoring system
  SCORE_START: 100,
  SCORE_CRITICAL_PENALTY: 20,
  SCORE_WARNING_PENALTY: 5,
  SCORE_INFO_PENALTY: 1,
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ValidationError {
  type:
    | 'LOAD_SPIKE'
    | 'INSUFFICIENT_RECOVERY'
    | 'CONSECUTIVE_HARD'
    | 'DURATION_OVERFLOW'
    | 'INTENSITY_IMBALANCE'
    | 'INADEQUATE_PREP'
    | 'TAPER_ISSUE'
    | 'STRUCTURE_ISSUE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  affectedWeeks?: number[];
  affectedSessions?: number[];
  currentValue?: number;
  expectedValue?: number;
  suggestion: string;
}

interface ValidationMetrics {
  averageWeeklyVolume: number; // seconds
  totalPlanVolume: number; // seconds
  largestWeeklyIncrease: number; // percentage
  easyHardRatio: number; // actual easy:hard volume ratio
  totalRestDays: number;
  recoveryWeeksCount: number;
  longestRun: number; // meters
  averageSessionsPerWeek: number;
}

interface ValidationReport {
  valid: boolean;
  overallScore: number;
  summary: string;
  errors: ValidationError[];
  metrics: ValidationMetrics;
}

interface Session {
  eventId?: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  sport: string;
  goalDistance?: number;
  goalDuration?: number;
  goalRpe?: number;
  description: string;
}

interface Week {
  trainingWeekId?: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  theme?: string;
  targetVolume?: number;
  sessions: Session[];
}

interface Cycle {
  cycleId?: number;
  name: string;
  phase: 'BASE' | 'SPECIFIC' | 'TAPER' | 'RECOVERY' | 'COMPETITION';
  startDate: string;
  endDate: string;
  weeks: Week[];
}

interface TrainingPlan {
  trainingPlanId?: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  cycles: Cycle[];
}

interface AthleteAvailability {
  athleteAvailabilityId: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine if a session is "hard" based on RPE
 */
function isHardSession(session: Session): boolean {
  if (!session.goalRpe) return false;
  return session.goalRpe > VALIDATION_CONSTANTS.HARD_SESSION_RPE_THRESHOLD;
}

/**
 * Calculate weekly volume from sessions (sum of goal_duration)
 */
function calculateWeeklyVolume(week: Week): number {
  return week.sessions.reduce(
    (sum, session) => sum + (session.goalDuration || 0),
    0,
  );
}

/**
 * Count rest days in a week (days with no sessions)
 */
function countRestDays(week: Week): number {
  const weekStart = new Date(week.startDate);
  const sessionDates = new Set(
    week.sessions.map((s) => new Date(s.startDate).toDateString()),
  );

  let restDays = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    if (!sessionDates.has(day.toDateString())) {
      restDays++;
    }
  }
  return restDays;
}

/**
 * Calculate time difference in hours between two dates
 */
function hoursBetween(date1: Date, date2: Date): number {
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
}

/**
 * Parse time string "HH:mm" to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate duration in minutes between two time strings
 */
function calculateTimeDuration(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return end >= start ? end - start : end + 1440 - start; // Handle overnight
}

/**
 * Get day of week from date (0=Sunday, 1=Monday, etc.)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Find availability window for a session
 */
function findAvailabilityWindow(
  session: Session,
  availability: AthleteAvailability[],
): AthleteAvailability | null {
  const sessionDate = new Date(session.startDate);
  const dayOfWeek = getDayOfWeek(sessionDate);

  // Find availability slots for this day
  const dayAvailability = availability.filter(
    (slot) => slot.dayOfWeek === dayOfWeek,
  );

  // For now, return the first matching day slot
  // TODO: In future, check actual session start time if available
  return dayAvailability.length > 0 ? dayAvailability[0] : null;
}

// ============================================================================
// VALIDATION RULE IMPLEMENTATIONS
// ============================================================================

/**
 * Rule 1: Load Progression Validation
 * Check that weekly volume doesn't increase too rapidly
 */
function validateLoadProgression(plan: TrainingPlan): ValidationError[] {
  const errors: ValidationError[] = [];
  const allWeeks = plan.cycles.flatMap((cycle) => cycle.weeks);

  for (let i = 1; i < allWeeks.length; i++) {
    const prevWeek = allWeeks[i - 1];
    const currWeek = allWeeks[i];

    const prevVolume = calculateWeeklyVolume(prevWeek);
    const currVolume = calculateWeeklyVolume(currWeek);

    if (prevVolume === 0) continue; // Skip if no previous volume

    const increasePercent = ((currVolume - prevVolume) / prevVolume) * 100;

    // Check if it's a recovery week (volume decrease is OK)
    if (increasePercent < 0) continue;

    if (
      increasePercent > VALIDATION_CONSTANTS.MAX_WEEKLY_VOLUME_INCREASE_PERCENT
    ) {
      errors.push({
        type: 'LOAD_SPIKE',
        severity: 'CRITICAL',
        description: `Week ${currWeek.weekNumber} has a ${increasePercent.toFixed(1)}% volume increase from previous week (${(prevVolume / 3600).toFixed(1)}h → ${(currVolume / 3600).toFixed(1)}h). This exceeds the safe limit of ${VALIDATION_CONSTANTS.MAX_WEEKLY_VOLUME_INCREASE_PERCENT}% and significantly increases injury risk.`,
        affectedWeeks: [currWeek.weekNumber],
        currentValue: increasePercent,
        expectedValue: VALIDATION_CONSTANTS.MAX_WEEKLY_VOLUME_INCREASE_PERCENT,
        suggestion: `Reduce week ${currWeek.weekNumber} volume to max ${((prevVolume * (1 + VALIDATION_CONSTANTS.MAX_WEEKLY_VOLUME_INCREASE_PERCENT / 100)) / 3600).toFixed(1)}h, or spread the increase over multiple weeks with smaller increments.`,
      });
    } else if (
      increasePercent >
      VALIDATION_CONSTANTS.WARNING_WEEKLY_VOLUME_INCREASE_PERCENT
    ) {
      errors.push({
        type: 'LOAD_SPIKE',
        severity: 'WARNING',
        description: `Week ${currWeek.weekNumber} has a ${increasePercent.toFixed(1)}% volume increase from previous week. While not critical, this approaches the 10% rule limit and should be monitored.`,
        affectedWeeks: [currWeek.weekNumber],
        currentValue: increasePercent,
        expectedValue:
          VALIDATION_CONSTANTS.WARNING_WEEKLY_VOLUME_INCREASE_PERCENT,
        suggestion: `Consider moderating the volume increase to stay under 10% for safer progression. Current: ${(currVolume / 3600).toFixed(1)}h, suggested max: ${((prevVolume * 1.1) / 3600).toFixed(1)}h.`,
      });
    }
  }

  return errors;
}

/**
 * Rule 2: Recovery Adequacy Validation
 * Check for rest days and recovery weeks
 */
function validateRecovery(plan: TrainingPlan): ValidationError[] {
  const errors: ValidationError[] = [];
  const allWeeks = plan.cycles.flatMap((cycle) => cycle.weeks);

  // Check rest days per week
  allWeeks.forEach((week) => {
    const restDays = countRestDays(week);
    if (restDays < VALIDATION_CONSTANTS.MIN_REST_DAYS_PER_WEEK) {
      errors.push({
        type: 'INSUFFICIENT_RECOVERY',
        severity: 'CRITICAL',
        description: `Week ${week.weekNumber} has ${restDays} rest day(s). At least ${VALIDATION_CONSTANTS.MIN_REST_DAYS_PER_WEEK} rest day per week is essential for adaptation and injury prevention.`,
        affectedWeeks: [week.weekNumber],
        currentValue: restDays,
        expectedValue: VALIDATION_CONSTANTS.MIN_REST_DAYS_PER_WEEK,
        suggestion: `Add at least one complete rest day to week ${week.weekNumber}. Consider making the lowest volume day a full rest day.`,
      });
    }
  });

  // Check for recovery weeks (every 3-4 weeks should have volume reduction)
  let weeksWithoutRecovery = 0;
  for (let i = 1; i < allWeeks.length; i++) {
    const prevWeek = allWeeks[i - 1];
    const currWeek = allWeeks[i];
    const prevVolume = calculateWeeklyVolume(prevWeek);
    const currVolume = calculateWeeklyVolume(currWeek);

    if (prevVolume === 0) continue;

    const reductionPercent = ((prevVolume - currVolume) / prevVolume) * 100;

    // Check if this is a recovery week
    if (
      reductionPercent >=
      VALIDATION_CONSTANTS.RECOVERY_WEEK_VOLUME_REDUCTION_MIN
    ) {
      weeksWithoutRecovery = 0; // Reset counter
    } else {
      weeksWithoutRecovery++;
    }

    if (weeksWithoutRecovery >= VALIDATION_CONSTANTS.RECOVERY_WEEK_FREQUENCY) {
      errors.push({
        type: 'INSUFFICIENT_RECOVERY',
        severity: 'WARNING',
        description: `No recovery week detected in the last ${weeksWithoutRecovery} weeks (ending at week ${currWeek.weekNumber}). Recovery weeks (20-40% volume reduction) are recommended every 3-4 weeks for adaptation and fatigue management.`,
        affectedWeeks: [currWeek.weekNumber],
        suggestion: `Consider making week ${currWeek.weekNumber + 1} a recovery week by reducing volume by 20-30%. This allows the body to absorb training stress and adapt.`,
      });
      weeksWithoutRecovery = 0; // Reset to avoid duplicate errors
    }
  }

  return errors;
}

/**
 * Rule 3: Hard Session Spacing Validation
 * Check that hard sessions are not scheduled within 24h of each other
 */
function validateHardSessionSpacing(plan: TrainingPlan): ValidationError[] {
  const errors: ValidationError[] = [];

  // Collect all sessions with dates
  const allSessions: Array<Session & { weekNumber: number }> = [];
  plan.cycles.forEach((cycle) => {
    cycle.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        allSessions.push({ ...session, weekNumber: week.weekNumber });
      });
    });
  });

  // Sort by start date
  allSessions.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  // Check consecutive hard sessions
  const hardSessions = allSessions.filter((s) => isHardSession(s));

  for (let i = 1; i < hardSessions.length; i++) {
    const prevSession = hardSessions[i - 1];
    const currSession = hardSessions[i];

    const hoursDiff = hoursBetween(
      new Date(prevSession.startDate),
      new Date(currSession.startDate),
    );

    if (hoursDiff < VALIDATION_CONSTANTS.MIN_HOURS_BETWEEN_HARD_SESSIONS) {
      const affectedWeeks = [
        ...new Set([prevSession.weekNumber, currSession.weekNumber]),
      ];

      errors.push({
        type: 'CONSECUTIVE_HARD',
        severity: 'CRITICAL',
        description: `Two hard sessions scheduled only ${hoursDiff.toFixed(1)} hours apart (weeks ${affectedWeeks.join(', ')}). Hard sessions (RPE > ${VALIDATION_CONSTANTS.HARD_SESSION_RPE_THRESHOLD}) require minimum ${VALIDATION_CONSTANTS.MIN_HOURS_BETWEEN_HARD_SESSIONS}h recovery to prevent overtraining and injury.`,
        affectedWeeks,
        currentValue: hoursDiff,
        expectedValue: VALIDATION_CONSTANTS.MIN_HOURS_BETWEEN_HARD_SESSIONS,
        suggestion: `Move one of these hard sessions to allow at least 24-48h recovery between them. Session details: "${prevSession.description}" (RPE ${prevSession.goalRpe}) and "${currSession.description}" (RPE ${currSession.goalRpe}).`,
      });
    }
  }

  return errors;
}

/**
 * Rule 4: Intensity Distribution Validation
 * Check 80/20 rule (80% easy volume, 20% hard)
 */
function validateIntensityDistribution(plan: TrainingPlan): ValidationError[] {
  const errors: ValidationError[] = [];

  let totalEasyVolume = 0;
  let totalHardVolume = 0;

  plan.cycles.forEach((cycle) => {
    cycle.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        const duration = session.goalDuration || 0;
        if (isHardSession(session)) {
          totalHardVolume += duration;
        } else {
          totalEasyVolume += duration;
        }
      });
    });
  });

  const totalVolume = totalEasyVolume + totalHardVolume;
  if (totalVolume === 0) return errors;

  const hardPercent = (totalHardVolume / totalVolume) * 100;

  if (hardPercent > VALIDATION_CONSTANTS.CRITICAL_HARD_VOLUME_PERCENT) {
    errors.push({
      type: 'INTENSITY_IMBALANCE',
      severity: 'CRITICAL',
      description: `Plan has ${hardPercent.toFixed(1)}% hard volume (RPE > ${VALIDATION_CONSTANTS.HARD_SESSION_RPE_THRESHOLD}), which significantly exceeds the 80/20 guideline. This level of intensity greatly increases overtraining and injury risk.`,
      currentValue: hardPercent,
      expectedValue: 20,
      suggestion: `Reduce intensity of some hard sessions or convert them to easy/moderate sessions. Target: ~20% hard volume. Current breakdown: ${(totalHardVolume / 3600).toFixed(1)}h hard, ${(totalEasyVolume / 3600).toFixed(1)}h easy.`,
    });
  } else if (hardPercent > VALIDATION_CONSTANTS.WARNING_HARD_VOLUME_PERCENT) {
    errors.push({
      type: 'INTENSITY_IMBALANCE',
      severity: 'WARNING',
      description: `Plan has ${hardPercent.toFixed(1)}% hard volume, which is above the recommended 80/20 guideline (20% hard). While some deviation is acceptable depending on training phase, monitor for signs of overtraining.`,
      currentValue: hardPercent,
      expectedValue: 20,
      suggestion: `Consider reducing hard volume slightly to stay closer to the 80/20 principle. This improves sustainability and reduces injury risk. Current: ${(totalHardVolume / 3600).toFixed(1)}h hard (${hardPercent.toFixed(1)}%), target: ~${(totalVolume / 5 / 3600).toFixed(1)}h hard (20%).`,
    });
  }

  return errors;
}

/**
 * Rule 5: Session Duration vs Availability Validation
 * Check that sessions fit within athlete's availability windows
 */
async function validateSessionDurations(
  plan: TrainingPlan,
  athleteId: number,
  prisma: any,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Fetch athlete availability from database
  const availability = await prisma.athlete_availability.findMany({
    where: { athlete_id: athleteId },
    orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
  });

  if (availability.length === 0) {
    // No availability data - add INFO error
    errors.push({
      type: 'DURATION_OVERFLOW',
      severity: 'INFO',
      description:
        'No availability windows defined for athlete. Cannot validate if sessions fit within available time slots.',
      suggestion:
        'Add athlete availability windows to enable session duration validation.',
    });
    return errors;
  }

  // Convert to camelCase
  const availabilitySlots: AthleteAvailability[] = availability.map(
    (slot: any) => ({
      athleteAvailabilityId: slot.athlete_availability_id,
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      priority: slot.priority,
    }),
  );

  // Check each session
  plan.cycles.forEach((cycle) => {
    cycle.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        if (!session.goalDuration) return; // Skip sessions without duration

        const sessionDurationMinutes = session.goalDuration / 60; // Convert seconds to minutes
        const availabilityWindow = findAvailabilityWindow(
          session,
          availabilitySlots,
        );

        if (!availabilityWindow) {
          errors.push({
            type: 'DURATION_OVERFLOW',
            severity: 'WARNING',
            description: `Session in week ${week.weekNumber} scheduled for ${new Date(session.startDate).toLocaleDateString('en-US', { weekday: 'long' })} but no availability window exists for that day. Session: "${session.description}" (${(sessionDurationMinutes / 60).toFixed(1)}h).`,
            affectedWeeks: [week.weekNumber],
            suggestion: `Either add an availability window for this day or reschedule the session to a day with availability.`,
          });
          return;
        }

        // Calculate available duration in this window
        const windowDurationMinutes = calculateTimeDuration(
          availabilityWindow.startTime,
          availabilityWindow.endTime,
        );

        // Add buffer for warmup/cooldown/transitions (15 minutes)
        const requiredDurationMinutes = sessionDurationMinutes + 15;

        if (requiredDurationMinutes > windowDurationMinutes) {
          errors.push({
            type: 'DURATION_OVERFLOW',
            severity: 'CRITICAL',
            description: `Session in week ${week.weekNumber} requires ${(requiredDurationMinutes / 60).toFixed(1)}h (including prep) but availability window is only ${(windowDurationMinutes / 60).toFixed(1)}h (${availabilityWindow.startTime}-${availabilityWindow.endTime}). Session: "${session.description}".`,
            affectedWeeks: [week.weekNumber],
            currentValue: requiredDurationMinutes,
            expectedValue: windowDurationMinutes,
            suggestion: `Either reduce session duration to ${(windowDurationMinutes / 60 - 0.25).toFixed(1)}h, extend availability window, or move session to a day with longer availability.`,
          });
        }
      });
    });
  });

  return errors;
}

/**
 * Rule 6: Race Preparation Validation
 * Check that long runs reach adequate percentage of race distance
 */
function validateRacePreparation(plan: TrainingPlan): ValidationError[] {
  const errors: ValidationError[] = [];

  // Try to extract race distance from goal (very basic parsing)
  // Example: "Finish UTMB 2025" or "Sub-3:30 marathon"
  const goalText = plan.goal.toLowerCase();

  // Note: This is a simple heuristic - in production, you'd want structured goal data
  let raceDistanceMeters: number | null = null;

  if (goalText.includes('marathon') && !goalText.includes('ultra')) {
    raceDistanceMeters = 42195; // Marathon
  } else if (goalText.includes('half marathon')) {
    raceDistanceMeters = 21097.5; // Half marathon
  } else if (goalText.includes('utmb')) {
    raceDistanceMeters = 170000; // UTMB approximate
  } else if (goalText.includes('10k')) {
    raceDistanceMeters = 10000;
  } else if (goalText.includes('5k')) {
    raceDistanceMeters = 5000;
  }
  // Add more race distance parsing as needed

  if (!raceDistanceMeters) {
    errors.push({
      type: 'INADEQUATE_PREP',
      severity: 'INFO',
      description:
        'Cannot determine race distance from goal to validate long run preparation. Consider using structured goal format (e.g., "Marathon - 42.2km").',
      suggestion:
        'Add structured race distance information to enable long run validation.',
    });
    return errors;
  }

  // Find longest run in plan
  let longestRunMeters = 0;

  plan.cycles.forEach((cycle) => {
    cycle.weeks.forEach((week) => {
      week.sessions.forEach((session) => {
        if (session.goalDistance && session.goalDistance > longestRunMeters) {
          longestRunMeters = session.goalDistance;
        }
      });
    });
  });

  if (longestRunMeters === 0) {
    errors.push({
      type: 'INADEQUATE_PREP',
      severity: 'WARNING',
      description:
        'No long runs with specified distances found in plan. Long runs are essential for race preparation.',
      suggestion:
        'Add long runs with progressive distance targets building towards race distance.',
    });
    return errors;
  }

  const longestRunPercent = (longestRunMeters / raceDistanceMeters) * 100;

  if (
    longestRunPercent < VALIDATION_CONSTANTS.LONG_RUN_CRITICAL_PERCENT_OF_RACE
  ) {
    errors.push({
      type: 'INADEQUATE_PREP',
      severity: 'CRITICAL',
      description: `Longest run is only ${(longestRunMeters / 1000).toFixed(1)}km (${longestRunPercent.toFixed(0)}% of ${(raceDistanceMeters / 1000).toFixed(1)}km race distance). This is insufficient preparation for the race distance and significantly increases risk of hitting the wall or DNF.`,
      currentValue: longestRunPercent,
      expectedValue: VALIDATION_CONSTANTS.LONG_RUN_TARGET_PERCENT_OF_RACE,
      suggestion: `Build longest run to at least ${((raceDistanceMeters * VALIDATION_CONSTANTS.LONG_RUN_TARGET_PERCENT_OF_RACE) / 100000).toFixed(1)}km (70-80% of race distance) to ensure adequate preparation.`,
    });
  } else if (
    longestRunPercent < VALIDATION_CONSTANTS.LONG_RUN_WARNING_PERCENT_OF_RACE
  ) {
    errors.push({
      type: 'INADEQUATE_PREP',
      severity: 'WARNING',
      description: `Longest run is ${(longestRunMeters / 1000).toFixed(1)}km (${longestRunPercent.toFixed(0)}% of race distance). While not critical, ideally build to 70-80% of race distance for optimal preparation.`,
      currentValue: longestRunPercent,
      expectedValue: VALIDATION_CONSTANTS.LONG_RUN_TARGET_PERCENT_OF_RACE,
      suggestion: `Consider adding one more long run building to ${((raceDistanceMeters * 0.75) / 1000).toFixed(1)}km to improve race-day confidence and preparation.`,
    });
  }

  return errors;
}

/**
 * Rule 7: Taper Validation
 * Check that taper weeks reduce volume appropriately
 */
function validateTaper(plan: TrainingPlan): ValidationError[] {
  const errors: ValidationError[] = [];

  // Find taper cycles
  const taperCycles = plan.cycles.filter((c) => c.phase === 'TAPER');

  if (taperCycles.length === 0) {
    errors.push({
      type: 'TAPER_ISSUE',
      severity: 'INFO',
      description:
        'No taper phase detected in plan. Tapering is essential for peak performance on race day.',
      suggestion:
        'Add a 2-3 week taper phase before the goal race with progressive volume reduction (40-60% from peak).',
    });
    return errors;
  }

  // Find peak volume (highest weekly volume before taper)
  const allWeeks = plan.cycles.flatMap((cycle) => cycle.weeks);
  const taperStartWeek = Math.min(
    ...taperCycles.flatMap((c) => c.weeks.map((w) => w.weekNumber)),
  );
  const preTaperWeeks = allWeeks.filter((w) => w.weekNumber < taperStartWeek);

  if (preTaperWeeks.length === 0) {
    return errors; // No pre-taper data
  }

  const peakVolume = Math.max(
    ...preTaperWeeks.map((w) => calculateWeeklyVolume(w)),
  );

  // Check taper volume reduction
  taperCycles.forEach((cycle) => {
    cycle.weeks.forEach((week) => {
      const taperVolume = calculateWeeklyVolume(week);
      const reductionPercent = ((peakVolume - taperVolume) / peakVolume) * 100;

      if (reductionPercent < VALIDATION_CONSTANTS.TAPER_WARNING_REDUCTION_MIN) {
        errors.push({
          type: 'TAPER_ISSUE',
          severity: 'WARNING',
          description: `Taper week ${week.weekNumber} has only ${reductionPercent.toFixed(0)}% volume reduction from peak (${(peakVolume / 3600).toFixed(1)}h → ${(taperVolume / 3600).toFixed(1)}h). Taper should reduce volume by 40-60% to allow full recovery.`,
          affectedWeeks: [week.weekNumber],
          currentValue: reductionPercent,
          expectedValue: VALIDATION_CONSTANTS.TAPER_VOLUME_REDUCTION_MIN,
          suggestion: `Reduce volume in week ${week.weekNumber} to approximately ${((peakVolume * 0.5) / 3600).toFixed(1)}h (50% reduction) to ensure adequate recovery for race day.`,
        });
      }
    });
  });

  return errors;
}

/**
 * Calculate validation metrics
 */
function calculateMetrics(plan: TrainingPlan): ValidationMetrics {
  const allWeeks = plan.cycles.flatMap((cycle) => cycle.weeks);

  // Total volume
  let totalPlanVolume = 0;
  let totalEasyVolume = 0;
  let totalHardVolume = 0;
  let longestRun = 0;
  let totalRestDays = 0;
  let totalSessionCount = 0;

  allWeeks.forEach((week) => {
    const weekVolume = calculateWeeklyVolume(week);
    totalPlanVolume += weekVolume;
    totalRestDays += countRestDays(week);
    totalSessionCount += week.sessions.length;

    week.sessions.forEach((session) => {
      const duration = session.goalDuration || 0;
      if (isHardSession(session)) {
        totalHardVolume += duration;
      } else {
        totalEasyVolume += duration;
      }

      if (session.goalDistance && session.goalDistance > longestRun) {
        longestRun = session.goalDistance;
      }
    });
  });

  // Average weekly volume
  const averageWeeklyVolume =
    allWeeks.length > 0 ? totalPlanVolume / allWeeks.length : 0;

  // Largest weekly increase
  let largestWeeklyIncrease = 0;
  for (let i = 1; i < allWeeks.length; i++) {
    const prevVolume = calculateWeeklyVolume(allWeeks[i - 1]);
    const currVolume = calculateWeeklyVolume(allWeeks[i]);
    if (prevVolume > 0) {
      const increase = ((currVolume - prevVolume) / prevVolume) * 100;
      if (increase > largestWeeklyIncrease) {
        largestWeeklyIncrease = increase;
      }
    }
  }

  // Easy/Hard ratio
  const totalVolume = totalEasyVolume + totalHardVolume;
  const easyHardRatio = totalVolume > 0 ? totalEasyVolume / totalHardVolume : 0;

  // Recovery weeks count (weeks with >20% volume drop)
  let recoveryWeeksCount = 0;
  for (let i = 1; i < allWeeks.length; i++) {
    const prevVolume = calculateWeeklyVolume(allWeeks[i - 1]);
    const currVolume = calculateWeeklyVolume(allWeeks[i]);
    if (prevVolume > 0) {
      const reduction = ((prevVolume - currVolume) / prevVolume) * 100;
      if (reduction >= 20) {
        recoveryWeeksCount++;
      }
    }
  }

  // Average sessions per week
  const averageSessionsPerWeek =
    allWeeks.length > 0 ? totalSessionCount / allWeeks.length : 0;

  return {
    averageWeeklyVolume,
    totalPlanVolume,
    largestWeeklyIncrease,
    easyHardRatio,
    totalRestDays,
    recoveryWeeksCount,
    longestRun,
    averageSessionsPerWeek,
  };
}

/**
 * Calculate overall validation score (0-100)
 */
function calculateScore(errors: ValidationError[]): number {
  let score = VALIDATION_CONSTANTS.SCORE_START;

  errors.forEach((error) => {
    switch (error.severity) {
      case 'CRITICAL':
        score -= VALIDATION_CONSTANTS.SCORE_CRITICAL_PENALTY;
        break;
      case 'WARNING':
        score -= VALIDATION_CONSTANTS.SCORE_WARNING_PENALTY;
        break;
      case 'INFO':
        score -= VALIDATION_CONSTANTS.SCORE_INFO_PENALTY;
        break;
    }
  });

  return Math.max(0, Math.min(100, score)); // Clamp to 0-100
}

/**
 * Generate summary text
 */
function generateSummary(
  errors: ValidationError[],
  score: number,
  metrics: ValidationMetrics,
): string {
  const criticalCount = errors.filter((e) => e.severity === 'CRITICAL').length;
  const warningCount = errors.filter((e) => e.severity === 'WARNING').length;
  const infoCount = errors.filter((e) => e.severity === 'INFO').length;

  let summary = `Plan validation score: ${score}/100. `;

  if (criticalCount === 0 && warningCount === 0 && infoCount === 0) {
    summary +=
      'Excellent! Plan follows all best practices and safety guidelines. ';
  } else if (criticalCount > 0) {
    summary += `Found ${criticalCount} CRITICAL issue(s) that must be addressed before finalizing the plan. `;
  } else if (warningCount > 0) {
    summary += `Found ${warningCount} warning(s) that should be reviewed. `;
  }

  summary += `Total plan: ${(metrics.totalPlanVolume / 3600).toFixed(0)}h over ${Math.ceil(metrics.averageSessionsPerWeek)} sessions/week avg. `;
  summary += `Easy:Hard ratio ${metrics.easyHardRatio.toFixed(1)}:1. `;

  if (criticalCount > 0) {
    summary += 'Please fix critical issues before proceeding with this plan.';
  } else if (warningCount > 0) {
    summary +=
      'Plan is usable but consider addressing warnings for optimal safety and effectiveness.';
  } else {
    summary += 'Plan is ready for athlete approval.';
  }

  return summary;
}

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const validatePlanTool = createTool({
  id: 'validate-plan',
  description:
    'Validates a complete training plan structure against evidence-based training principles, safety constraints, and athlete-specific limitations. Use this when you need to: (1) Perform final QA check before plan approval, (2) Identify potential risks or violations, (3) Get actionable suggestions for improvements, (4) Ensure plan follows periodization best practices. Returns detailed validation report with categorized findings (errors, warnings, suggestions), severity levels, and comprehensive metrics. Critical for plan safety and effectiveness.',
  inputSchema: z.object({
    plan: z
      .any()
      .describe(
        'Full plan structure to validate with cycles, weeks, and sessions',
      ),
    constraints: z
      .object({
        maxWeeklyVolumeIncrease: z
          .number()
          .optional()
          .default(VALIDATION_CONSTANTS.MAX_WEEKLY_VOLUME_INCREASE_PERCENT)
          .describe('Maximum allowed weekly volume increase percentage'),
        minRestDaysPerWeek: z
          .number()
          .optional()
          .default(VALIDATION_CONSTANTS.MIN_REST_DAYS_PER_WEEK)
          .describe('Minimum rest days required per week'),
        maxConsecutiveHardDays: z
          .number()
          .optional()
          .default(0)
          .describe(
            'Maximum consecutive hard training days (0 = none allowed)',
          ),
        targetEasyHardRatio: z
          .number()
          .optional()
          .default(VALIDATION_CONSTANTS.TARGET_EASY_VOLUME_PERCENT)
          .describe(
            'Target percentage of easy volume (80 = 80% easy, 20% hard)',
          ),
        hardSessionRpeThreshold: z
          .number()
          .optional()
          .default(VALIDATION_CONSTANTS.HARD_SESSION_RPE_THRESHOLD)
          .describe('RPE threshold above which sessions are considered "hard"'),
      })
      .optional()
      .describe(
        'Optional constraint overrides (uses defaults if not provided)',
      ),
  }),
  outputSchema: z.object({
    valid: z
      .boolean()
      .describe(
        'True if no CRITICAL errors found, false if plan has critical safety issues',
      ),
    overallScore: z
      .number()
      .min(0)
      .max(100)
      .describe(
        'Overall plan quality score (100 = perfect, 0 = many violations)',
      ),
    summary: z
      .string()
      .describe('Human-readable summary of validation results'),
    errors: z.array(
      z.object({
        type: z
          .enum([
            'LOAD_SPIKE',
            'INSUFFICIENT_RECOVERY',
            'CONSECUTIVE_HARD',
            'DURATION_OVERFLOW',
            'INTENSITY_IMBALANCE',
            'INADEQUATE_PREP',
            'TAPER_ISSUE',
            'STRUCTURE_ISSUE',
          ])
          .describe('Category of validation error'),
        severity: z
          .enum(['CRITICAL', 'WARNING', 'INFO'])
          .describe(
            'Severity: CRITICAL = must fix, WARNING = should fix, INFO = nice to fix',
          ),
        description: z.string().describe('Detailed description of the issue'),
        affectedWeeks: z
          .array(z.number())
          .optional()
          .describe('Week numbers affected by this issue'),
        affectedSessions: z
          .array(z.number())
          .optional()
          .describe('Session IDs affected by this issue'),
        currentValue: z.number().optional().describe('Measured value'),
        expectedValue: z
          .number()
          .optional()
          .describe('Expected/threshold value'),
        suggestion: z
          .string()
          .describe('Actionable suggestion for fixing the issue'),
      }),
    ),
    metrics: z.object({
      averageWeeklyVolume: z
        .number()
        .describe('Average weekly training volume in seconds'),
      totalPlanVolume: z.number().describe('Total plan volume in seconds'),
      largestWeeklyIncrease: z
        .number()
        .describe('Largest week-to-week volume increase percentage'),
      easyHardRatio: z
        .number()
        .describe(
          'Ratio of easy volume to hard volume (e.g., 4.0 = 4:1 = 80/20)',
        ),
      totalRestDays: z.number().describe('Total rest days in entire plan'),
      recoveryWeeksCount: z
        .number()
        .describe('Number of recovery weeks (>20% volume reduction)'),
      longestRun: z
        .number()
        .describe('Longest training run distance in meters'),
      averageSessionsPerWeek: z
        .number()
        .describe('Average number of sessions per week'),
    }),
  }),
  execute: async ({ context: input, runtimeContext }) => {
    try {
      const { plan, constraints } = input;

      // Get athleteId and prisma from RuntimeContext
      const athleteId = runtimeContext?.get('athleteId');
      const prisma = runtimeContext?.get('prisma');

      if (!athleteId) {
        throw new Error(
          'athleteId not found in context - authentication issue',
        );
      }

      if (!prisma) {
        throw new Error('prisma not found in context - service unavailable');
      }

      // Override constants if custom constraints provided
      if (constraints) {
        if (constraints.maxWeeklyVolumeIncrease !== undefined) {
          (VALIDATION_CONSTANTS as any).MAX_WEEKLY_VOLUME_INCREASE_PERCENT =
            constraints.maxWeeklyVolumeIncrease;
        }
        if (constraints.minRestDaysPerWeek !== undefined) {
          (VALIDATION_CONSTANTS as any).MIN_REST_DAYS_PER_WEEK =
            constraints.minRestDaysPerWeek;
        }
        if (constraints.targetEasyHardRatio !== undefined) {
          (VALIDATION_CONSTANTS as any).TARGET_EASY_VOLUME_PERCENT =
            constraints.targetEasyHardRatio;
        }
        if (constraints.hardSessionRpeThreshold !== undefined) {
          (VALIDATION_CONSTANTS as any).HARD_SESSION_RPE_THRESHOLD =
            constraints.hardSessionRpeThreshold;
        }
      }

      const trainingPlan: TrainingPlan = plan;

      // Run all validation rules
      const allErrors: ValidationError[] = [];

      // Rule 1: Load Progression
      allErrors.push(...validateLoadProgression(trainingPlan));

      // Rule 2: Recovery Adequacy
      allErrors.push(...validateRecovery(trainingPlan));

      // Rule 3: Hard Session Spacing
      allErrors.push(...validateHardSessionSpacing(trainingPlan));

      // Rule 4: Intensity Distribution
      allErrors.push(...validateIntensityDistribution(trainingPlan));

      // Rule 5: Session Duration vs Availability (async - needs DB)
      const durationErrors = await validateSessionDurations(
        trainingPlan,
        athleteId,
        prisma,
      );
      allErrors.push(...durationErrors);

      // Rule 6: Race Preparation
      allErrors.push(...validateRacePreparation(trainingPlan));

      // Rule 7: Taper Validation
      allErrors.push(...validateTaper(trainingPlan));

      // Calculate metrics
      const metrics = calculateMetrics(trainingPlan);

      // Calculate score
      const score = calculateScore(allErrors);

      // Check if plan is valid (no critical errors)
      const valid = !allErrors.some((e) => e.severity === 'CRITICAL');

      // Generate summary
      const summary = generateSummary(allErrors, score, metrics);

      const report: ValidationReport = {
        valid,
        overallScore: score,
        summary,
        errors: allErrors,
        metrics,
      };

      console.log(
        `[validate-plan] Validation complete. Score: ${score}/100, Valid: ${valid}, Errors: ${allErrors.length}`,
      );

      return report;
    } catch (error) {
      console.error('[validate-plan] Validation failed:', error);
      throw new Error(
        `Plan validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
