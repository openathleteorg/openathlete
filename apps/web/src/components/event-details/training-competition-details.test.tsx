// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type ActivityEvent,
  EVENT_TYPE,
  type Event,
  SPORT_TYPE,
  type TrainingEvent,
} from '@openathlete/shared';

import { TrainingCompetitionDetails } from './training-competition-details';

const calendar = vi.hoisted(() => ({
  events: [] as unknown[],
  openEventDetails: vi.fn(),
}));
const link = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const unlink = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));

// Rendered without the app's query client: the user reads metric units
vi.mock('@/hooks/use-units', async () => {
  const { unitsFor } = await import('@/utils/units');
  return { useUnits: () => unitsFor('METRIC') };
});

vi.mock('@/api/event', () => ({
  useSetRelatedActivityMutation: () => link,
  useUnsetRelatedActivityMutation: () => unlink,
}));
vi.mock('../calendar/hooks/use-calendar-context', () => ({
  useCalendarContext: () => calendar,
}));
// Every message renders as its key.
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));
vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'es' }));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
// cmdk measures and scrolls its list.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => undefined;

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute);
const activity = (
  eventId: number,
  name: string,
  start: Date,
  sport = SPORT_TYPE.RUNNING,
) =>
  ({
    eventId,
    type: EVENT_TYPE.ACTIVITY,
    name,
    sport,
    startDate: start,
    endDate: new Date(start.getTime() + 3600_000),
    distance: 8200,
  }) as unknown as ActivityEvent;

const session = (relatedActivity?: ActivityEvent) =>
  ({
    eventId: 1,
    type: EVENT_TYPE.TRAINING,
    name: 'Series',
    sport: SPORT_TYPE.RUNNING,
    startDate: at(6, 8),
    endDate: at(6, 9),
    relatedActivity,
  }) as unknown as TrainingEvent;

describe('linking an activity to a session', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    link.mutate.mockReset();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (event: TrainingEvent, events: Event[]) =>
    act(async () => {
      calendar.events = events;
      root.render(<TrainingCompetitionDetails event={event} />);
    });
  const suggestions = () =>
    [
      ...container.querySelectorAll('[data-link-suggestions] button'),
    ] as HTMLButtonElement[];

  it('suggests the same day activities, same sport first', async () => {
    await render(session(), [
      activity(10, 'Bici', at(6, 7, 30), SPORT_TYPE.CYCLING),
      activity(11, 'Rodaje tarde', at(6, 18, 5)),
      activity(12, 'Ayer', at(5, 8)),
    ]);
    expect(container.textContent).toContain('related_activity_suggestions');
    expect(suggestions().map((button) => button.textContent)).toEqual([
      'Rodaje tarde · 18:05 · 8.20 kmrelated_activity_link',
      'Bici · 07:30 · 8.20 kmrelated_activity_link',
    ]);

    await act(async () => suggestions()[0].click());
    expect(link.mutate).toHaveBeenCalledWith({ eventId: 1, activityId: 11 });
  });

  it('shows no suggestions once linked, or without same day activities', async () => {
    const done = activity(11, 'Rodaje', at(6, 18));
    await render(session(done), [done, activity(13, 'Otra', at(6, 20))]);
    expect(container.querySelector('[data-link-suggestions]')).toBeNull();
    // The linked activity is shown with its time and distance.
    expect(container.textContent).toContain('Rodaje · 18:00 · 8.20 km');

    await render(session(), [activity(12, 'Ayer', at(5, 8))]);
    expect(container.querySelector('[data-link-suggestions]')).toBeNull();
  });

  it('lists the same day first in the dropdown, then nearby days', async () => {
    await render(session(), [
      activity(12, 'Ayer', at(5, 8)),
      activity(10, 'Bici', at(6, 7, 30), SPORT_TYPE.CYCLING),
      activity(11, 'Rodaje tarde', at(6, 18, 5)),
    ]);
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[role="combobox"]')!.click(),
    );
    const groups = [...document.body.querySelectorAll('[cmdk-group]')].map(
      (group) => ({
        heading: group.querySelector('[cmdk-group-heading]')?.textContent,
        items: [...group.querySelectorAll('[cmdk-item]')].map(
          (item) => item.textContent,
        ),
      }),
    );
    expect(groups).toEqual([
      {
        heading: 'related_activity_same_day',
        items: ['Rodaje tarde · 18:05 · 8.20 km', 'Bici · 07:30 · 8.20 km'],
      },
      {
        heading: 'related_activity_nearby',
        items: [expect.stringMatching(/^Ayer · .+ · 8\.20 km$/)],
      },
    ]);
  });

  it('offers at most three suggestions', async () => {
    await render(
      session(),
      [7, 9, 12, 16, 19].map((hour) => activity(hour, `A${hour}`, at(6, hour))),
    );
    expect(suggestions()).toHaveLength(3);
  });
});
