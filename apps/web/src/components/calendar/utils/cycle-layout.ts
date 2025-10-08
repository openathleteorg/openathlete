import { Cycle } from '@openathlete/shared';

export interface CycleSegment {
  cycle: Cycle;
  startDate: Date;
  endDate: Date;
  startDayIndex: number; // 0-6 for day of week
  durationDays: number; // Number of days this segment spans
  row: number; // Vertical position to avoid overlaps
}

/**
 * Calculate cycle segments for a given week
 * A cycle may span multiple weeks, so we need to split it into segments
 */
export function calculateCycleSegmentsForWeek(
  cycles: Cycle[],
  weekDays: Date[],
): CycleSegment[] {
  const weekStart = new Date(weekDays[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekDays[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const segments: CycleSegment[] = [];

  cycles.forEach((cycle) => {
    const cycleStart = new Date(cycle.startDate);
    const cycleEnd = new Date(cycle.endDate);

    // Check if cycle intersects with this week
    if (cycleEnd < weekStart || cycleStart > weekEnd) {
      return; // Cycle doesn't intersect this week
    }

    // Calculate the visible portion of the cycle in this week
    const segmentStart = new Date(
      Math.max(cycleStart.getTime(), weekStart.getTime()),
    );
    const segmentEnd = new Date(
      Math.min(cycleEnd.getTime(), weekEnd.getTime()),
    );

    // Normalize to start of day for comparison
    segmentStart.setHours(0, 0, 0, 0);
    segmentEnd.setHours(0, 0, 0, 0);

    // Find which day of the week this segment starts (0 = first day, 6 = last day)
    let startDayIndex = 0;
    for (let i = 0; i < weekDays.length; i++) {
      const dayNormalized = new Date(weekDays[i]);
      dayNormalized.setHours(0, 0, 0, 0);
      if (dayNormalized.getTime() === segmentStart.getTime()) {
        startDayIndex = i;
        break;
      }
    }

    // Calculate duration in days
    const durationMs = segmentEnd.getTime() - segmentStart.getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1;

    segments.push({
      cycle,
      startDate: segmentStart,
      endDate: segmentEnd,
      startDayIndex: startDayIndex >= 0 ? startDayIndex : 0,
      durationDays,
      row: 0, // Will be calculated later
    });
  });

  // Sort segments by start date and duration
  segments.sort((a, b) => {
    const dateCompare = a.startDate.getTime() - b.startDate.getTime();
    if (dateCompare !== 0) return dateCompare;
    return b.durationDays - a.durationDays; // Longer cycles first
  });

  // Calculate row positions to avoid overlaps
  assignRowPositions(segments);

  return segments;
}

/**
 * Assign row positions to segments to avoid visual overlaps
 * Uses a greedy algorithm to pack cycles efficiently
 */
function assignRowPositions(segments: CycleSegment[]): void {
  const rows: Array<{ endDayIndex: number }> = [];

  segments.forEach((segment) => {
    const segmentEndIndex = segment.startDayIndex + segment.durationDays - 1;

    // Find the first row where this segment fits
    let assignedRow = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].endDayIndex < segment.startDayIndex) {
        // This row is available
        assignedRow = i;
        rows[i].endDayIndex = segmentEndIndex;
        break;
      }
    }

    // If no row available, create a new one
    if (assignedRow === -1) {
      assignedRow = rows.length;
      rows.push({ endDayIndex: segmentEndIndex });
    }

    segment.row = assignedRow;
  });
}
