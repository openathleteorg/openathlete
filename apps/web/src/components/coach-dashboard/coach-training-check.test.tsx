// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CoachTrainingCheck } from './coach-training-check';

const state = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock('@/api/statistics', () => ({
  useTrainingCheckQuery: () => ({ data: undefined, isLoading: false }),
  useTrainingCheckAthletesQuery: () => ({ data: state.data }),
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));
vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'en' }));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('CoachTrainingCheck', () => {
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
        <MemoryRouter>
          <CoachTrainingCheck
            athletes={[
              { athleteId: 1, name: 'Ada' },
              { athleteId: 2, name: 'Ben' },
            ]}
          />
        </MemoryRouter>,
      ),
    );

  it('puts the athletes who need a look first, each name opening the figures', () => {
    state.data = {
      athletes: [
        {
          athleteId: 1,
          fitness: 'BETTER',
          speed: 'SAME',
          durability: 'OPEN',
          recovery: 'SAME',
          design: 'FINE',
        },
        {
          athleteId: 2,
          fitness: 'SAME',
          speed: 'SAME',
          durability: 'OPEN',
          recovery: 'WORSE',
          design: 'NOTE',
        },
        // Not on the dashboard (another group): left out
        {
          athleteId: 3,
          fitness: 'WORSE',
          speed: 'WORSE',
          durability: 'WORSE',
          recovery: 'WORSE',
          design: 'NOTE',
        },
      ],
    };
    render();
    const rows = [...container.querySelectorAll<HTMLElement>('[data-athlete]')];
    expect(rows.map((row) => row.dataset.athlete)).toEqual(['2', '1']);
    expect(rows[0].querySelector('a')?.getAttribute('href')).toBe(
      '/dashboard/statistics/2?view=check',
    );
    expect(
      [...rows[0].querySelectorAll<HTMLElement>('[data-status]')].map(
        (mark) => mark.dataset.status,
      ),
    ).toEqual(['SAME', 'SAME', 'OPEN', 'WORSE', 'NOTE']);
    expect(rows[0].textContent).toContain(
      'check_col_recovery: check_status_worse',
    );
  });

  it('stays out without answers', () => {
    state.data = { athletes: [] };
    render();
    expect(container.querySelector('[data-coach-check]')).toBeNull();
  });
});
