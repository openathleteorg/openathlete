// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import {
  StatisticsFiltersState,
  useStatisticsFilters,
} from './use-statistics-filters';

function filtersAt(url: string, canCompare: boolean): StatisticsFiltersState {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  let state: StatisticsFiltersState | undefined;
  function Probe() {
    state = useStatisticsFilters(null, canCompare);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <Probe />
      </MemoryRouter>,
    ),
  );
  act(() => root.unmount());
  return state!;
}

describe('useStatisticsFilters and the comparison perk', () => {
  it('reads ?compare= for those who may compare', () => {
    const filters = filtersAt('/statistics?compare=lastYear', true);
    expect(filters.comparison).toBe('lastYear');
    expect(filters.compared).not.toBeNull();
  });

  it('opens a shared ?compare= link without comparison, without an error', () => {
    const filters = filtersAt('/statistics?compare=previous', false);
    expect(filters.comparison).toBe('none');
    expect(filters.compared).toBeNull();
    // The period itself stays readable
    expect(filters.period).not.toBeNull();
  });
});
