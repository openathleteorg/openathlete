// @vitest-environment jsdom
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppSidebar } from './app-sidebar';

const state = vi.hoisted(() => ({
  space: 'COACH' as 'COACH' | 'ATHLETE',
  athletes: [] as {
    athleteId: number;
    user: { firstName: string; lastName: string };
  }[],
}));

vi.mock('@/api/athlete', () => ({
  useGetMyCoachedAthletesQuery: () => ({ data: state.athletes }),
}));
vi.mock('@/contexts/space', () => ({
  useSpaceContext: () => ({ space: state.space }),
}));
vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));
vi.mock('@/components/sidebar/nav-user', () => ({ NavUser: () => null }));
vi.mock('@/components/sidebar/space-switcher', () => ({
  SpaceSwitcher: () => null,
}));
vi.mock('@/components/mobile/mobile-account-controls', () => ({
  MobileAccountControls: () => null,
}));
// Every message renders as its key.
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  // jsdom lacks the browser APIs the sidebar and Radix menus rely on.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});

const athletes = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    athleteId: 101 + index,
    user: { firstName: 'Athlete', lastName: String(index + 1) },
  }));

function CurrentPath() {
  return <output data-path>{useLocation().pathname}</output>;
}

let root: Root | undefined;
let container: HTMLDivElement;

async function render({
  open = false,
  path = '/dashboard/coach',
  width = 1024,
}: { open?: boolean; path?: string; width?: number } = {}) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root!.render(
      <MemoryRouter initialEntries={[path]}>
        <SidebarProvider defaultOpen={open}>
          <AppSidebar />
          <SidebarTrigger />
        </SidebarProvider>
        <CurrentPath />
      </MemoryRouter>,
    ),
  );
}

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  document.body.innerHTML = '';
  state.space = 'COACH';
});

const selector = () =>
  document.querySelector<HTMLButtonElement>('button[aria-label="athletes"]');
const key = (element: Element, value: string) =>
  act(async () => {
    element.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true }),
    );
  });
const openAthlete = async (name: string) => {
  await key(selector()!, 'Enter');
  const trigger = [
    ...document.querySelectorAll('[data-slot="dropdown-menu-sub-trigger"]'),
  ].find((item) => item.textContent?.includes(name))!;
  await act(async () => (trigger as HTMLElement).click());
};
const menuLinks = () =>
  [
    ...document.querySelectorAll<HTMLAnchorElement>(
      '[data-slot="dropdown-menu-sub-content"] a',
    ),
  ].map((link) => link.getAttribute('href'));

describe('AppSidebar collapsed on desktop', () => {
  it("replaces the athletes' hidden submenus with one Athletes menu", async () => {
    state.athletes = athletes(2);
    await render();

    expect(
      document.querySelectorAll('button[aria-label="athletes"]'),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll('[data-slot="collapsible-trigger"]'),
    ).toHaveLength(0);
    // Pages that are not per athlete stay as icons.
    expect(document.querySelector('a[href="/dashboard/coach"]')).not.toBeNull();

    await openAthlete('Athlete 2');
    expect(menuLinks()).toEqual([
      '/dashboard/calendar/102',
      '/dashboard/statistics/102',
      '/dashboard/progression/102',
      '/dashboard/records/102',
      '/dashboard/metrics/102',
      '/dashboard/settings/102',
    ]);

    const calendar = document.querySelector<HTMLAnchorElement>(
      '[data-slot="dropdown-menu-sub-content"] a[href="/dashboard/calendar/102"]',
    )!;
    await act(async () => calendar.click());
    expect(document.querySelector('[data-path]')!.textContent).toBe(
      '/dashboard/calendar/102',
    );
  });

  it('marks the current athlete and page', async () => {
    state.athletes = athletes(2);
    await render({ path: '/dashboard/statistics/102' });

    expect(selector()!.getAttribute('data-active')).toBe('true');
    await openAthlete('Athlete 2');
    const current = document.querySelector(
      '[data-slot="dropdown-menu-sub-content"] a[aria-current="page"]',
    );
    expect(current!.getAttribute('href')).toBe('/dashboard/statistics/102');
  });

  it('is disabled without athletes', async () => {
    state.athletes = [];
    await render();
    expect(selector()!.disabled).toBe(true);
  });
});

describe('AppSidebar elsewhere', () => {
  it('keeps the athlete tree when the sidebar is expanded', async () => {
    state.athletes = athletes(1);
    await render({ open: true });
    expect(selector()).toBeNull();
    expect(
      document.querySelector('a[href="/dashboard/calendar/101"]'),
    ).not.toBeNull();
  });

  it("keeps the athlete space's own pages", async () => {
    state.space = 'ATHLETE';
    state.athletes = athletes(1);
    await render();
    expect(selector()).toBeNull();
    expect(
      document.querySelector('a[href="/dashboard/calendar"]'),
    ).not.toBeNull();
  });

  it('keeps the athlete tree in the drawer on phones', async () => {
    state.athletes = athletes(1);
    await render({ width: 390 });
    await act(async () =>
      document
        .querySelector<HTMLButtonElement>('[data-sidebar="trigger"]')!
        .click(),
    );
    const drawer = document.querySelector('[role="dialog"]')!;
    expect(
      drawer.querySelector('a[href="/dashboard/calendar/101"]'),
    ).not.toBeNull();
    expect(selector()).toBeNull();
  });
});
