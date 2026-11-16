// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityEvent, EVENT_TYPE } from '@openathlete/shared';

import { EventHeading, gpxFileName } from './event-heading';

const api = vi.hoisted(() => ({ getEventGpx: vi.fn() }));
vi.mock('@/api/event/event.api', () => ({ EventAPI: api }));
vi.mock('../sport-icon/sport-icon', () => ({ SportIcon: () => null }));
// Every message renders as its key, followed by its parameters.
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

const activity = (overrides: Partial<ActivityEvent> = {}) =>
  ({
    eventId: 7,
    type: EVENT_TYPE.ACTIVITY,
    name: 'Morning Run',
    startDate: new Date('2026-10-14T07:44:00Z'),
    provider: null,
    externalId: 'gpx-manual:1',
    ...overrides,
  }) as ActivityEvent;

describe('EventHeading GPX track', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    api.getEventGpx.mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const gpxButton = () =>
    [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('activity_gpx_download'),
    );

  it('offers the track only for an activity with GPS', () => {
    act(() => root.render(<EventHeading event={activity()} />));
    expect(gpxButton()).toBeUndefined();
    act(() =>
      root.render(<EventHeading event={activity({ hasTrack: true })} />),
    );
    expect(gpxButton()).toBeDefined();
  });

  it('downloads the track under the day and name of the activity', async () => {
    api.getEventGpx.mockResolvedValue(new Blob(['<gpx/>']));
    URL.createObjectURL = vi.fn(() => 'blob:gpx');
    URL.revokeObjectURL = vi.fn();
    let saved = '';
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        saved = this.download;
      });
    act(() =>
      root.render(<EventHeading event={activity({ hasTrack: true })} />),
    );

    await act(async () => gpxButton()!.click());

    expect(api.getEventGpx).toHaveBeenCalledWith(7);
    expect(saved).toBe('2026-10-14-Morning-Run.gpx');
    click.mockRestore();
  });

  it('keeps file names plain', () => {
    expect(
      gpxFileName({
        name: 'Länger Lauf / Zürich!',
        startDate: new Date('2026-01-06T07:00:00Z'),
      }),
    ).toBe('2026-01-06-Langer-Lauf-Zurich.gpx');
  });
});
