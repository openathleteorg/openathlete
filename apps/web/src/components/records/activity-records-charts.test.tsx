// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RECORD_TYPE, SPORT_TYPE } from '@openathlete/shared';

import { ActivityRecordsCharts } from './activity-records-charts';

const queries = vi.hoisted(() => [] as { from: Date; to: Date }[]);
// Rendered without the app's query client: the user reads metric units
vi.mock('@/hooks/use-units', async () => {
  const { unitsFor } = await import('@/utils/units');
  return { useUnits: () => unitsFor('METRIC') };
});

vi.mock('@/api/record', () => ({
  useGetRecordsQuery: (query: { from: Date; to: Date }) => {
    queries.push(query);
    // The weeks before: 1 km in 4:00, 5 min at 260 W
    return {
      data: [
        { type: RECORD_TYPE.SPEED, distance: 1000, duration: null, value: 240 },
        { type: RECORD_TYPE.POWER, distance: null, duration: 300, value: 260 },
      ],
    };
  },
}));
vi.mock('./records-curve-chart', () => ({ RecordsCurveChart: () => null }));
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

const start = new Date('2026-10-20T07:00:00Z');

describe('ActivityRecordsCharts', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    queries.length = 0;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() =>
      root.render(
        <ActivityRecordsCharts
          sport={SPORT_TYPE.RUNNING}
          athleteId={3}
          startDate={start}
          records={[
            // Faster on the kilometre, weaker over 5 minutes
            {
              type: RECORD_TYPE.SPEED,
              distance: 1000,
              duration: null,
              value: 230,
            },
            {
              type: RECORD_TYPE.POWER,
              distance: null,
              duration: 300,
              value: 250,
            },
          ]}
        />,
      ),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('compares with the 42 days before the activity, not after', () => {
    const { from, to } = queries[queries.length - 1];
    expect(to.toISOString()).toBe(start.toISOString());
    expect((to.getTime() - from.getTime()) / 86_400_000).toBe(42);
  });

  it('names the efforts the activity did better', () => {
    const beaten = container.querySelector('[data-best-efforts-beaten]')!;
    expect(beaten.textContent).toContain('pace 1 km');
    expect(beaten.textContent).not.toContain('power');
  });

  it('switches to 90 days', () => {
    const ninety = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('90'),
    )!;
    act(() => ninety.click());
    const { from, to } = queries[queries.length - 1];
    expect((to.getTime() - from.getTime()) / 86_400_000).toBe(90);
  });
});
