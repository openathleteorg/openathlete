// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SPORT_TYPE } from '@openathlete/shared';

import {
  ActivityDetailsSelectionProvider,
  useActivityDetailsSelection,
} from '../event-details/activity-details-selection-context';
import { DecouplingCard } from './decoupling-card';

// Every message renders as its key, followed by its parameters
// Rendered without the app's query client: the user reads metric units
vi.mock('@/hooks/use-units', async () => {
  const { unitsFor } = await import('@/utils/units');
  return { useUnits: () => unitsFor('METRIC') };
});

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

const range = <T,>(n: number, f: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(i));

// An hour's ride at 200 W, a sample a minute: 10 minutes of warm-up at
// 110 bpm, then 140 bpm, drifting to 150 for the last half hour
const stream = {
  time: range(61, (i) => i * 60),
  watts: range(61, () => 200),
  heartrate: range(61, (i) => (i < 10 ? 110 : i < 30 ? 140 : 150)),
};

function Selected({ domain }: { domain?: [number, number] }) {
  const { setDomain } = useActivityDetailsSelection();
  useEffect(() => setDomain(domain), [domain, setDomain]);
  return <DecouplingCard stream={stream} sport={SPORT_TYPE.CYCLING} />;
}

describe('DecouplingCard', () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = (domain?: [number, number]) =>
    act(() =>
      root.render(
        <ActivityDetailsSelectionProvider
          fullDomain={[0, 3600]}
          xAxis="time"
          onXAxisChange={() => {}}
        >
          <Selected domain={domain} />
        </ActivityDetailsSelectionProvider>,
      ),
    );
  const percent = () =>
    Number.parseFloat(
      container.querySelector('[data-decoupling-percent]')!.textContent!,
    );

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('reads power against heart rate, the warm-up making it worse', () => {
    render();
    expect(container.textContent).toContain('activity_decoupling_kind_power');
    expect(percent()).toBeGreaterThan(10);
    expect(
      container
        .querySelector('[data-decoupling]')!
        .getAttribute('data-decoupling'),
    ).toBe('marked');
  });

  it('leaves the warm-up out with the slider', () => {
    render();
    const slider = container.querySelector<HTMLInputElement>(
      '[data-decoupling-warmup]',
    )!;
    act(() => {
      // React listens to the native setter, then the input event
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(slider, '10');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(container.textContent).toContain('activity_decoupling_warmup 10');
    // 140 then 150 over the remaining 50 minutes, halves at 35 minutes
    expect(percent()).toBeLessThan(10);
    expect(percent()).toBeGreaterThan(0);
  });

  it('reads the selection, without the slider', () => {
    render([600, 1800]);
    expect(container.textContent).toContain('activity_zones_selection');
    expect(container.querySelector('[data-decoupling-warmup]')).toBeNull();
    // A steady 140 bpm from 10 to 30 minutes
    expect(percent()).toBe(0);
  });
});
