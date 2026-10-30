// @vitest-environment jsdom
import { SpaceProvider, useSpaceContext } from '@/contexts/space';
import { CURRENT_SPACE, setItem } from '@/utils/local-storage';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { CoachDashboardPage } from './index';

vi.mock('@/views/dashboard/coach-dashboard-view', () => ({
  CoachDashboardView: () => null,
}));
vi.mock('@/paraglide/messages', () => ({
  m: { coach_dashboard: () => 'Coach dashboard' },
}));

function Layout() {
  const { space, setSpace } = useSpaceContext();
  return (
    <>
      <output>{space}</output>
      <button onClick={() => setSpace('ATHLETE')}>athlete</button>
      <Outlet />
    </>
  );
}

let root: Root;
let container: HTMLDivElement;

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <SpaceProvider>
            <Layout />
          </SpaceProvider>
        ),
        children: [
          { path: '/dashboard/coach', element: <CoachDashboardPage /> },
          { path: '/dashboard/calendar', element: null },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  act(() => root.render(<RouterProvider router={router} />));
  return router;
}

const currentSpace = () => container.querySelector('output')?.textContent;

beforeEach(() => {
  // react-dom only flushes act() in an environment that declares it
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it('lets the coach go back to the athlete space', async () => {
  setItem(CURRENT_SPACE, 'COACH');
  const router = renderAt('/dashboard/coach');

  await act(async () => {
    container.querySelector('button')?.click();
  });

  expect(currentSpace()).toBe('ATHLETE');
  expect(router.state.location.pathname).toBe('/dashboard/calendar');
});

it('switches to the coach space when opened from the athlete space', async () => {
  setItem(CURRENT_SPACE, 'ATHLETE');
  await act(async () => {
    renderAt('/dashboard/coach');
  });

  expect(currentSpace()).toBe('COACH');
});
