import { Units, unitsFor } from '@/utils/units';

import { formatDuration } from '@openathlete/shared';

import { XAxisKind } from './stream-range';

/** A position on the charts' axis: distance in user units or elapsed time */
export function formatAxisValue(
  value: number,
  kind: XAxisKind,
  units: Units = unitsFor('METRIC'),
) {
  return kind === 'distance'
    ? `${units.formatDist(value)} ${units.distanceLabel}`
    : formatDuration(value);
}
