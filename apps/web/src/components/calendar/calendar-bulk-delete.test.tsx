// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { BulkWorkoutSelectButton } from './bulk-workout-select-button';
import { CalendarBulkDelete } from './calendar-bulk-delete';
import { useBulkWorkoutSelection } from './contexts/bulk-workout-selection-context';

const state = vi.hoisted(() => ({
  space: 'COACH',
  calendar: {
    athleteId: 7,
    allowCreate: true,
    displayedMonth: new Date(2026, 9, 1),
    view: 'month' as 'month' | 'week',
    weekStart: new Date(2026, 9, 5),
    events: [] as Array<{
      eventId: number;
      name: string;
      startDate: Date;
      type: string;
      relatedActivity?: object;
    }>,
  },
  remove: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/api/event/event.api', () => ({
  EventAPI: { deleteEvent: (id: number) => state.remove(id) },
}));
vi.mock('@/contexts/space', () => ({
  useSpaceContext: () => ({ space: state.space }),
}));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('./hooks/use-shift-actions', () => ({
  useShiftActions: () => ({ move: vi.fn(), copy: vi.fn(), busy: false }),
}));
vi.mock('./hooks/use-calendar-context', () => ({
  useCalendarContext: () => state.calendar,
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueriesData: vi.fn(),
    removeQueries: vi.fn(),
    invalidateQueries: state.invalidate,
  }),
}));
vi.mock('@/utils/capacitor', () => ({ isCapacitor: () => false }));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_t, k) => () => String(k) }),
}));
vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'en' }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function Rows() {
  const bulk = useBulkWorkoutSelection()!;
  return (
    <>
      {state.calendar.events.map((e) => (
        <button
          key={e.eventId}
          data-row={e.eventId}
          onClick={() => bulk.toggle(e.eventId)}
          aria-pressed={bulk.selected.has(e.eventId)}
        >
          {e.name}
        </button>
      ))}
    </>
  );
}
function App() {
  return (
    <CalendarBulkDelete header={<BulkWorkoutSelectButton />}>
      <Rows />
    </CalendarBulkDelete>
  );
}
let container: HTMLDivElement;
let root: Root;
async function render() {
  await act(async () => root.render(<App />));
}
async function click(selector: string) {
  const target = document.querySelector(selector) as HTMLButtonElement;
  expect(target).toBeTruthy();
  await act(async () => target.click());
}
beforeEach(async () => {
  state.space = 'COACH';
  state.calendar.athleteId = 7;
  state.calendar.allowCreate = true;
  state.calendar.displayedMonth = new Date(2026, 9, 1);
  state.calendar.view = 'month';
  state.calendar.weekStart = new Date(2026, 9, 5);
  state.calendar.events = [1, 2].map((id) => ({
    eventId: id,
    name: 'Workout ' + id,
    startDate: new Date(2026, 9, id),
    type: 'TRAINING',
  }));
  state.remove.mockReset().mockResolvedValue(undefined);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await render();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
async function select() {
  await click('[data-bulk-workouts-select]');
  await click('[data-row="1"]');
  await click('[data-row="2"]');
}
async function confirmDialog() {
  const buttons = [
    ...document.querySelectorAll('[data-bulk-workouts-toolbar] button'),
  ];
  const remove = buttons.find((b) =>
    b.textContent?.includes('bulk_workouts_delete'),
  ) as HTMLButtonElement;
  await act(async () => remove.click());
}
it('requires confirmation, shows names and lets the coach cancel', async () => {
  await select();
  await confirmDialog();
  const dialog = document.querySelector('[role="dialog"]')!;
  expect(dialog.textContent).toContain('Workout 1');
  expect(dialog.textContent).toContain('Workout 2');
  expect(state.remove).not.toHaveBeenCalled();
  const cancel = [...dialog.querySelectorAll('button')].find(
    (b) => b.textContent === 'cancel',
  )!;
  await act(async () => cancel.click());
  expect(state.remove).not.toHaveBeenCalled();
});
it('keeps only failed deletions selected for a targeted retry', async () => {
  state.remove.mockImplementation(async (id: number) => {
    if (id === 2) throw new Error('provider');
  });
  await select();
  await confirmDialog();
  await click('[data-bulk-delete-confirm]');
  expect(state.remove.mock.calls.map(([id]) => id)).toEqual([1, 2]);
  expect(
    document.querySelector('[data-row="1"]')?.getAttribute('aria-pressed'),
  ).toBe('false');
  expect(
    document.querySelector('[data-row="2"]')?.getAttribute('aria-pressed'),
  ).toBe('true');
  state.remove.mockReset().mockResolvedValue(undefined);
  await confirmDialog();
  await click('[data-bulk-delete-confirm]');
  expect(state.remove.mock.calls.map(([id]) => id)).toEqual([2]);
});
it('resets selection on athlete change and prunes filtered sessions', async () => {
  await select();
  state.calendar.events = state.calendar.events.filter((e) => e.eventId === 2);
  await render();
  await confirmDialog();
  expect(document.querySelector('[role="dialog"]')?.textContent).not.toContain(
    'Workout 1',
  );
  state.calendar.athleteId = 8;
  await render();
  expect(document.querySelector('[data-bulk-workouts-toolbar]')).toBeNull();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
it('hides selection from athletes and read-only calendars', async () => {
  state.space = 'ATHLETE';
  await render();
  expect(document.querySelector('[data-bulk-workouts-select]')).toBeNull();
  state.space = 'COACH';
  state.calendar.allowCreate = false;
  await render();
  expect(document.querySelector('[data-bulk-workouts-select]')).toBeNull();
});
it('resets selection when the shown week changes within a month', async () => {
  state.calendar.view = 'week';
  await render();
  await select();
  // Next week, same displayed month: nothing selected out of sight remains
  state.calendar.weekStart = new Date(2026, 9, 12);
  await render();
  expect(document.querySelector('[data-bulk-workouts-toolbar]')).toBeNull();
  expect(
    document.querySelector('[data-row="1"]')?.getAttribute('aria-pressed'),
  ).toBe('false');
});
