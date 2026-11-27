// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrainingCheckDto } from '@openathlete/shared';

import { TrainingCheckCard } from './training-check-card';

const state = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock('@/api/statistics', () => ({
  useTrainingCheckQuery: () => ({ data: state.data, isLoading: false }),
}));
vi.mock('../garmin-attribution/garmin-attribution', () => ({
  GarminAttribution: () => null,
}));
vi.mock('./metric-info', () => ({ MetricInfo: () => null }));
// Every message renders as its key, followed by its values
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get: (_target, key) => (values?: Record<string, unknown>) =>
        values
          ? `${String(key)} ${Object.values(values).join('|')}`
          : String(key),
    },
  ),
}));
vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'en' }));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const open = {
  status: 'OPEN' as const,
  current: null,
  previous: null,
  noise: null,
  counts: [0, 0] as [number, number],
};
const check = (parts: Partial<TrainingCheckDto>): TrainingCheckDto => ({
  from: new Date('2026-09-02'),
  split: new Date('2026-10-14'),
  to: new Date('2026-11-25'),
  fitness: { ...open, basis: 'SPEED', reference: null },
  speed: { status: 'OPEN', kind: null, current: null, previous: null },
  durability: open,
  ...parts,
});

describe('TrainingCheckCard', () => {
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

  const render = (data: TrainingCheckDto) => {
    state.data = data;
    act(() => root.render(<TrainingCheckCard athleteId={1} />));
  };
  const row = (id: string) =>
    container.querySelector<HTMLElement>(`[data-check="${id}"]`)!;

  it('stays out for someone who does not run', () => {
    render(check({}));
    expect(container.querySelector('[data-training-check]')).toBeNull();
  });

  it('says in beats how the heart rate moved at the same power', () => {
    render(
      check({
        fitness: {
          status: 'BETTER',
          current: -3.6,
          previous: 0.4,
          noise: 4,
          counts: [12, 11],
          basis: 'POWER',
          reference: 285,
        },
      }),
    );
    expect(row('fitness').dataset.status).toBe('BETTER');
    expect(row('fitness').textContent).toContain(
      'check_fitness_better 285 W|4',
    );
    expect(row('fitness').textContent).toContain('check_status_better');
  });

  it('names the pace when the comparison is on speed', () => {
    render(
      check({
        fitness: {
          status: 'SAME',
          current: 0.2,
          previous: 0,
          noise: 4,
          counts: [6, 4],
          basis: 'SPEED',
          // 5:00 /km
          reference: 1000 / 300,
        },
      }),
    );
    expect(row('fitness').textContent).toMatch(
      /check_fitness_same 5:00.*\|6\|4/,
    );
  });

  it('says what is missing while a question is open', () => {
    render(
      check({
        fitness: {
          ...open,
          counts: [6, 2],
          current: 1,
          previous: -2,
          basis: 'POWER',
          reference: 285,
        },
        speed: { status: 'OPEN', kind: 'power', current: 333, previous: null },
      }),
    );
    expect(row('fitness').textContent).toContain('check_fitness_open 4|6|2');
    expect(row('speed').textContent).toContain(
      'check_speed_open statistics_critical_power|333 W',
    );
    expect(row('durability').textContent).toContain(
      'check_durability_open 2|0|0',
    );
    expect(row('durability').dataset.status).toBe('OPEN');
  });

  it('compares the critical value of today with six weeks ago', () => {
    render(
      check({
        speed: { status: 'BETTER', kind: 'power', current: 320, previous: 315 },
        durability: {
          status: 'WORSE',
          current: 7.2,
          previous: 4.1,
          noise: 1,
          counts: [2, 3],
        },
      }),
    );
    expect(row('speed').textContent).toContain(
      'check_speed_better statistics_critical_power|320 W|315 W',
    );
    expect(row('durability').textContent).toContain(
      'check_durability_worse 7.2 %|4.1 %',
    );
  });
});
