/**
 * Helper functions to convert speed values between different units
 * for better readability by users in the agent context
 */

/**
 * Converts speed from m/s to km/h
 * @param speedMs - Speed in meters per second
 * @returns Speed in kilometers per hour, rounded to 2 decimals
 */
export function msToKmh(speedMs: number): number {
  return Math.round(speedMs * 3.6 * 100) / 100;
}

/**
 * Converts speed from m/s to min/km pace
 * @param speedMs - Speed in meters per second
 * @returns Pace as { minutes, seconds } or null if speed is 0
 */
export function msToMinPerKm(speedMs: number): {
  minutes: number;
  seconds: number;
  formatted: string;
} | null {
  if (speedMs === 0) return null;

  const paceSeconds = 1000 / speedMs; // seconds per km
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);

  return {
    minutes,
    seconds,
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')} min/km`,
  };
}

/**
 * Determines if a sport typically uses pace (min/km) or speed (km/h)
 * @param sport - The sport type
 * @returns 'pace' for running sports, 'speed' for others
 */
export function getPreferredSpeedUnit(
  sport: string,
): 'pace' | 'speed' | 'both' {
  const sportLower = sport.toLowerCase();

  // Running sports prefer pace (min/km)
  if (
    sportLower.includes('run') ||
    sportLower === 'trail_running' ||
    sportLower === 'running'
  ) {
    return 'pace';
  }

  // Cycling, swimming, and other sports prefer speed (km/h)
  if (
    sportLower.includes('cycl') ||
    sportLower.includes('bike') ||
    sportLower.includes('swim')
  ) {
    return 'speed';
  }

  // For other sports, provide both
  return 'both';
}

/**
 * Converts a speed value from m/s to a human-readable format
 * based on the sport type
 * @param speedMs - Speed in meters per second
 * @param sport - The sport type
 * @returns Object with converted speed in appropriate units
 */
export function convertSpeedForDisplay(
  speedMs: number,
  sport: string,
): {
  original_ms: number;
  kmh?: number;
  pace?: {
    minutes: number;
    seconds: number;
    formatted: string;
  } | null;
  display_text: string;
} {
  const preferredUnit = getPreferredSpeedUnit(sport);
  const kmh = msToKmh(speedMs);
  const pace = msToMinPerKm(speedMs);

  let displayText = '';

  if (preferredUnit === 'pace' && pace) {
    displayText = `${pace.formatted} (${kmh} km/h)`;
  } else if (preferredUnit === 'speed') {
    if (pace) {
      displayText = `${kmh} km/h (${pace.formatted})`;
    } else {
      displayText = `${kmh} km/h`;
    }
  } else {
    // both
    if (pace) {
      displayText = `${kmh} km/h / ${pace.formatted}`;
    } else {
      displayText = `${kmh} km/h`;
    }
  }

  return {
    original_ms: speedMs,
    ...(preferredUnit !== 'pace' && { kmh }),
    ...(preferredUnit !== 'speed' && { pace }),
    display_text: displayText,
  };
}

/**
 * Enriches an activity object with human-readable speed values
 * This function adds converted speed fields while keeping original values
 * @param activity - Activity object with speed values in m/s
 * @returns Activity object enriched with readable speed conversions
 */
export function enrichActivityWithReadableSpeeds(
  activity: any,
  sport: string,
): any {
  const enriched = { ...activity };

  // Convert average speed
  if (activity.average_speed !== undefined && activity.average_speed !== null) {
    enriched.average_speed_display = convertSpeedForDisplay(
      activity.average_speed,
      sport,
    );
  }

  // Convert max speed
  if (activity.max_speed !== undefined && activity.max_speed !== null) {
    enriched.max_speed_display = convertSpeedForDisplay(
      activity.max_speed,
      sport,
    );
  }

  // Convert average gap speed (grade adjusted pace)
  if (
    activity.average_gap_speed !== undefined &&
    activity.average_gap_speed !== null
  ) {
    enriched.average_gap_speed_display = convertSpeedForDisplay(
      activity.average_gap_speed,
      sport,
    );
  }

  // Convert average normalized speed
  if (
    activity.average_normalized_speed !== undefined &&
    activity.average_normalized_speed !== null
  ) {
    enriched.average_normalized_speed_display = convertSpeedForDisplay(
      activity.average_normalized_speed,
      sport,
    );
  }

  return enriched;
}

/**
 * Formats a speed explanation for the AI agent
 * Provides context about which unit to use and why
 * @param sport - The sport type
 * @returns Explanation text for the agent
 */
export function getSpeedExplanation(sport: string): string {
  const preferredUnit = getPreferredSpeedUnit(sport);

  if (preferredUnit === 'pace') {
    return `For running activities, pace (min/km) is the primary metric, with speed (km/h) as secondary context. Users typically think in terms of "how many minutes per kilometer" rather than "how many kilometers per hour".`;
  } else if (preferredUnit === 'speed') {
    return `For cycling and similar activities, speed (km/h) is the primary metric. Pace (min/km) is also provided for reference.`;
  } else {
    return `Both speed (km/h) and pace (min/km) are provided for this sport type.`;
  }
}
