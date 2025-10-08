import { Cycle } from '@openathlete/shared';

export interface CycleDaySegment {
  cycle: Cycle;
  isStart: boolean; // True if this day is the start of the cycle
  isEnd: boolean; // True if this day is the end of the cycle
  isContinuation: boolean; // True if this is a middle day
  rowIndex: number; // Stable row index for consistent vertical positioning
}

// Global cache for cycle row assignments to ensure consistency across all days
const cycleRowCache = new Map<number, number>();
let lastCycleSetHash = '';

/**
 * Calculate row indices for all cycles globally
 * This ensures consistent vertical positioning across all days
 */
function calculateGlobalRowIndices(cycles: Cycle[]): Map<number, number> {
  // Create a hash of cycle IDs and dates to detect if cycles changed
  const currentHash = cycles
    .map((c) => `${c.cycleId}-${c.startDate}-${c.endDate}`)
    .sort()
    .join(',');

  // Return cached result if cycles haven't changed
  if (currentHash === lastCycleSetHash && cycleRowCache.size > 0) {
    return cycleRowCache;
  }

  // Clear cache and recalculate
  cycleRowCache.clear();
  lastCycleSetHash = currentHash;

  // Sort cycles by start date for consistent ordering
  const sortedCycles = [...cycles].sort((a, b) => {
    const aStart = new Date(a.startDate).getTime();
    const bStart = new Date(b.startDate).getTime();
    if (aStart !== bStart) return aStart - bStart;
    return a.cycleId - b.cycleId;
  });

  const occupiedRows: Array<{ endTime: number; cycleId: number }[]> = [];

  sortedCycles.forEach((cycle) => {
    const cycleStart = new Date(cycle.startDate).getTime();
    const cycleEnd = new Date(cycle.endDate).getTime();

    // Find the first row where this cycle fits (no time overlap)
    let assignedRow = -1;
    for (let rowIdx = 0; rowIdx < occupiedRows.length; rowIdx++) {
      const row = occupiedRows[rowIdx];
      // Check if this row has space (all cycles in row end before this one starts)
      const hasSpace = row.every((item) => item.endTime < cycleStart);
      if (hasSpace) {
        assignedRow = rowIdx;
        row.push({ endTime: cycleEnd, cycleId: cycle.cycleId });
        break;
      }
    }

    // If no row available, create a new one
    if (assignedRow === -1) {
      assignedRow = occupiedRows.length;
      occupiedRows.push([{ endTime: cycleEnd, cycleId: cycle.cycleId }]);
    }

    cycleRowCache.set(cycle.cycleId, assignedRow);
  });

  return cycleRowCache;
}

/**
 * Calculate which cycles affect a specific day
 * Returns segments with info about whether it's start, end, or continuation
 * Row indices are assigned globally to maintain consistent vertical positioning
 */
export function calculateCyclesForDay(
  cycles: Cycle[],
  day: Date,
): CycleDaySegment[] {
  const dayNormalized = new Date(day);
  dayNormalized.setHours(0, 0, 0, 0);
  const dayTime = dayNormalized.getTime();

  // Calculate global row indices for all cycles
  const rowIndices = calculateGlobalRowIndices(cycles);

  const segments: CycleDaySegment[] = [];

  cycles.forEach((cycle) => {
    const cycleStart = new Date(cycle.startDate);
    cycleStart.setHours(0, 0, 0, 0);
    const cycleEnd = new Date(cycle.endDate);
    cycleEnd.setHours(0, 0, 0, 0);

    const cycleStartTime = cycleStart.getTime();
    const cycleEndTime = cycleEnd.getTime();

    // Check if this day is within the cycle range
    if (dayTime >= cycleStartTime && dayTime <= cycleEndTime) {
      segments.push({
        cycle,
        isStart: dayTime === cycleStartTime,
        isEnd: dayTime === cycleEndTime,
        isContinuation: dayTime > cycleStartTime && dayTime < cycleEndTime,
        rowIndex: rowIndices.get(cycle.cycleId) || 0,
      });
    }
  });

  // Sort by row index for consistent rendering order
  segments.sort((a, b) => a.rowIndex - b.rowIndex);

  return segments;
}
