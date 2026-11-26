// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ActivityEvent,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
} from '@openathlete/shared';

import {
  ActivityDetailsSelectionProvider,
  useActivityDetailsSelection,
} from '../event-details/activity-details-selection-context';
import { ZonesCard } from './zones-card';

const asked = vi.hoisted(() => [] as (number | undefined)[]);
// Rendered without the app's query client: the user reads metric units
vi.mock('@/hooks/use-units', async () => {
  const { unitsFor } = await import('@/utils/units');
  return { useUnits: () => unitsFor('METRIC') };
});

vi.mock('@/hooks/use-training-zones', () => ({
  useTrainingZones: (
    type: TRAINING_ZONE_TYPE,
    _sport: SPORT_TYPE,
    athleteId?: number,
  ) => {
    asked.push(athleteId);
    if (type === TRAINING_ZONE_TYPE.HEARTRATE)
      return [
        { id: 1, name: 'Z1', min: 0, max: 149, color: 'green' },
        { id: 2, name: 'Z2', min: 150, max: 220, color: 'red' },
      ];
    // Pace zones in minutes per kilometre: easy slower than 5:00, fast below
    if (type === TRAINING_ZONE_TYPE.PACE)
      return [
        { id: 3, name: 'Easy', min: 8, max: 5, color: 'blue' },
        { id: 4, name: 'Fast', min: 5, max: 3, color: 'purple' },
      ];
    return [];
  },
}));
// Every message renders as its key
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const range = <T,>(n: number, f: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(i));

// 100 s easy at 3 m/s and 140 bpm, then 100 s fast at 4 m/s and 160 bpm
const stream = {
  time: range(21, (i) => i * 10),
  distance: range(21, (i) => (i <= 10 ? i * 30 : 300 + (i - 10) * 40)),
  heartrate: range(21, (i) => (i < 10 ? 140 : 160)),
};
const event = {
  eventId: 1,
  athleteId: 42,
  sport: SPORT_TYPE.RUNNING,
} as ActivityEvent;

describe('ZonesCard', () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = (domain?: [number, number]) =>
    act(() =>
      root.render(
        <ActivityDetailsSelectionProvider
          fullDomain={[0, 200]}
          xAxis="time"
          onXAxisChange={() => {}}
        >
          <Selected domain={domain} />
        </ActivityDetailsSelectionProvider>,
      ),
    );

  beforeEach(() => {
    asked.length = 0;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const share = (zone: number) =>
    container.querySelector(`[data-zone="${zone}"]`)!.textContent;

  it("reads the activity's athlete's heart rate zones over time", () => {
    render();
    expect(asked.every((id) => id === 42)).toBe(true);
    expect(share(1)).toContain('1:40');
    expect(share(1)).toContain('50');
    expect(share(2)).toContain('1:40');
  });

  it('switches to pace zones', () => {
    render();
    const pace = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === 'pace',
    )!;
    act(() => pace.click());
    expect(
      container
        .querySelector('[data-zones-card]')!
        .getAttribute('data-zones-card'),
    ).toBe('speed');
    // 4 m/s is 4:10/km, in the fast zone
    expect(share(4)).toContain('1:40');
  });

  it('counts only the selected part', () => {
    render([100, 200]);
    expect(container.querySelector('[data-zones-selection]')).not.toBeNull();
    expect(share(1)).toContain('0:00');
    expect(share(2)).toContain('100');
  });
});

/** Applies a selection, as a drag on the charts would */
function Selected({ domain }: { domain?: [number, number] }) {
  const { setDomain } = useActivityDetailsSelection();
  useEffect(() => setDomain(domain), [domain, setDomain]);
  return <ZonesCard event={event} stream={stream} />;
}
