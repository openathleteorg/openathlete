// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SPORT_TYPE } from '@openathlete/shared';

import { EfficiencyCard } from './efficiency-card';

const response = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock('@/api/statistics', () => ({
  useStatisticsEfficiencyQuery: () => ({ data: response.data }),
}));
// The chart needs a laid out page: only what surrounds it is tested here
vi.mock('../ui/chart', () => ({
  ChartContainer: () => null,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));
vi.mock('./metric-info', () => ({ MetricInfo: () => null }));
// Every message renders as its key, followed by its parameters
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get: (_target, key) => (params?: Record<string, unknown>) =>
        [String(key), ...Object.values(params ?? {})].join(' '),
    },
  ),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const run = (day: number, total: number, factor: number | null = null) => ({
  eventId: day,
  name: `Run ${day}`,
  date: new Date(Date.UTC(2026, 9, day)),
  biomechanical: null,
  metabolic: null,
  total,
  factor,
});

describe('EfficiencyCard', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = () =>
    act(() =>
      root.render(
        <EfficiencyCard
          athleteId={1}
          period={{ start: new Date(), end: new Date() } as never}
          sport={SPORT_TYPE.RUNNING}
          visible
        />,
      ),
    );

  it('offers the figures the runs have, and reads the trend', () => {
    response.data = { runs: [run(1, 1.6, 1.3), run(21, 1.68)] };
    render();
    const tabs = [...container.querySelectorAll('[role="tab"]')].map(
      (tab) => tab.textContent,
    );
    // No power meter: no metres per joule, no joules per beat
    expect(tabs).toEqual([
      'statistics_efficiency_total',
      'statistics_efficiency',
    ]);
    expect(container.textContent).toContain(
      'statistics_efficiency_read +5.0 % 1.60 1.68 m',
    );
  });

  it('says so when no run has a figure', () => {
    response.data = { runs: [] };
    render();
    expect(container.textContent).toContain('statistics_efficiency_empty');
  });
});
