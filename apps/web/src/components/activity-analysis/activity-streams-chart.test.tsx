// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, useState } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SPORT_TYPE } from '@openathlete/shared';

import { ActivityDetailsSelectionProvider } from '../event-details/activity-details-selection-context';
import { ActivityStreamsChart } from './activity-streams-chart';
import { XAxisKind, xSeries } from './stream-range';

vi.mock('@/hooks/use-training-zones', () => ({ useTrainingZones: () => [] }));
const updateAccount = vi.hoisted(() => vi.fn());
vi.mock('@/api/user', async () => {
  const { useQuery } = await import('@tanstack/react-query');
  return {
    useGetMeQuery: () =>
      useQuery({
        queryKey: ['UserAPI.getMe'],
        queryFn: () => ({}),
        staleTime: Infinity,
      }),
    useUpdateAccountMutation: () => ({ mutate: updateAccount }),
  };
});
// Every message renders as its key
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const range = <T,>(n: number, f: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(i));

// 1 km in 1000 s, 1 m/s, heart rate rising from 100 to 200
const stream = {
  time: range(101, (i) => i * 10),
  distance: range(101, (i) => i * 10),
  heartrate: range(101, (i) => 100 + i),
  altitude: range(101, () => 50),
};

const queryClient = new QueryClient();
queryClient.setQueryData(['UserAPI.getMe'], {});

function Harness() {
  const [xAxis, setXAxis] = useState<XAxisKind>('distance');
  const series = xSeries(stream, xAxis)!;
  return (
    <QueryClientProvider client={queryClient}>
      <ActivityDetailsSelectionProvider
        fullDomain={[series[0], series[series.length - 1]]}
        xAxis={xAxis}
        onXAxisChange={setXAxis}
      >
        <ActivityStreamsChart stream={stream} sport={SPORT_TYPE.RUNNING} />
      </ActivityDetailsSelectionProvider>
    </QueryClientProvider>
  );
}

describe('ActivityStreamsChart', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(<Harness />));
    const plot = container.querySelector<HTMLElement>('[data-chart-plot]')!;
    // jsdom lays nothing out: the plot spans 0 to 1000 px
    plot.getBoundingClientRect = () =>
      ({ left: 0, width: 1000, top: 0, height: 200 }) as DOMRect;
    plot.setPointerCapture = () => {};
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const plot = () => container.querySelector<HTMLElement>('[data-chart-plot]')!;
  const pointer = (type: string, clientX: number) =>
    act(() => {
      plot().dispatchEvent(
        new MouseEvent(type, { bubbles: true, clientX }) as PointerEvent,
      );
    });
  const drag = (from: number, to: number) => {
    pointer('pointerdown', from);
    pointer('pointermove', to);
    pointer('pointerup', to);
  };

  it('shows a track per stream with data', () => {
    const tracks = [...container.querySelectorAll('[data-track]')].map((el) =>
      el.getAttribute('data-track'),
    );
    expect(tracks).toEqual(['speed', 'heartrate', 'altitude']);
  });

  it('reads every track where the pointer is', () => {
    pointer('pointermove', 500);
    const readout = container.querySelector('[data-chart-readout]')!;
    expect(readout.textContent).toContain('0.50 kilometers');
    expect(readout.textContent).toContain('150 bpm');
  });

  it('selects the dragged part and shows its figures', () => {
    drag(500, 1000);
    const selection = container.querySelector('[data-selection-stats]');
    expect(selection).not.toBeNull();
    // The second half: 500 m in 500 s, heart rate 150 to 200
    expect(selection!.textContent).toContain('8:20');
    expect(selection!.textContent).toContain('175 bpm');

    act(() =>
      container
        .querySelector<HTMLButtonElement>(
          '[aria-label="activity_selection_clear"]',
        )!
        .click(),
    );
    expect(container.querySelector('[data-selection-stats]')).toBeNull();
  });

  it('takes a tap for a reading, not a selection', () => {
    drag(500, 503);
    expect(container.querySelector('[data-selection-stats]')).toBeNull();
  });

  it('hides a track and remembers it for the sport', async () => {
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[data-track-toggle="altitude"]')!
        .click(),
    );
    await vi.waitFor(() =>
      expect(container.querySelector('[data-track="altitude"]')).toBeNull(),
    );
    expect(updateAccount).toHaveBeenCalledWith({
      hiddenActivityTracks: { RUNNING: ['temperature', 'altitude'] },
    });
  });

  it('switches to time, dropping the selection', () => {
    drag(0, 500);
    const time = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'activity_chart_time',
    )!;
    act(() => time.click());
    expect(time.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-selection-stats]')).toBeNull();
    pointer('pointermove', 500);
    expect(
      container.querySelector('[data-chart-readout]')!.textContent,
    ).toContain('8:20');
  });
});
