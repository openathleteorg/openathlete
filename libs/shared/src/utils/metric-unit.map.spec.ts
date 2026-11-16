import { describe, expect, it } from 'vitest';

import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';
import { metricUnitMap } from './metric-unit.map';

describe('metricUnitMap', () => {
  // Running power is entered in watts, like cycling power
  it('gives running power in watts', () => {
    expect(metricUnitMap[METRIC_TYPE.FTP_RUNNING]).toBe('W');
    expect(metricUnitMap[METRIC_TYPE.CRITICAL_POWER_RUNNING]).toBe('W');
  });
});
