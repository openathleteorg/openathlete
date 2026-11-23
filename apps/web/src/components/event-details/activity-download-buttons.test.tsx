// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityEvent, EVENT_TYPE } from '@openathlete/shared';

import { ActivityDownloadButtons } from './activity-download-buttons';
import { activityFileName } from './gpx-file-name';

const state = vi.hoisted(() => ({
  stream: undefined as unknown,
  native: false,
  getEventGpx: vi.fn(),
  getEventFit: vi.fn(),
  downloadFile: vi.fn(),
  streamQuery: vi.fn(),
}));
vi.mock('@/api/event', () => ({
  useGetEventStreamQuery: (...args: unknown[]) => {
    state.streamQuery(...args);
    return { data: state.stream };
  },
}));
vi.mock('@/api/event/event.api', () => ({
  EventAPI: { getEventGpx: state.getEventGpx, getEventFit: state.getEventFit },
}));
vi.mock('@/utils/capacitor', () => ({ isCapacitor: () => state.native }));
vi.mock('@/utils/csv', () => ({ downloadFile: state.downloadFile }));
// Every message renders as its key
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const event = {
  eventId: 7,
  type: EVENT_TYPE.ACTIVITY,
  name: 'Morning Run',
  startDate: new Date(2026, 9, 14, 7, 44),
} as ActivityEvent;

describe('ActivityDownloadButtons', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    state.native = false;
    state.stream = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const button = () => container.querySelector('[data-gpx-download]');
  const fitButton = () => container.querySelector('[data-fit-download]');
  const render = () =>
    act(() => root.render(<ActivityDownloadButtons event={event} />));

  it('offers GPX for a route, FIT for any recording, nothing without one', () => {
    state.stream = { heartrate: [120, 130] };
    render();
    expect(fitButton()).toBeNull();
    state.stream = { time: [0, 1], watts: [200, 210] };
    render();
    expect(button()).toBeNull();
    expect(fitButton()).not.toBeNull();
    state.stream = { time: [0, 1], latlng: [[], [47.6, 11.2]] };
    render();
    expect(button()).not.toBeNull();
  });

  it('reads the stream the details already loaded', () => {
    render();
    const [eventId, resolution, keys] = state.streamQuery.mock.calls[0];
    expect([eventId, resolution]).toEqual([7, 3000]);
    expect(keys).toContain('latlng');
  });

  it('stays out of the native apps', () => {
    state.native = true;
    state.stream = { time: [0], latlng: [[47.6, 11.2]] };
    render();
    expect(button()).toBeNull();
    expect(state.streamQuery.mock.calls[0][3]).toBe(false);
  });

  it('saves the track under the day and name of the activity', async () => {
    state.stream = { time: [0], latlng: [[47.6, 11.2]] };
    const file = new Blob(['<gpx/>']);
    state.getEventGpx.mockResolvedValue(file);
    render();
    await act(async () => (button() as HTMLButtonElement).click());
    expect(state.getEventGpx).toHaveBeenCalledWith(7);
    expect(state.downloadFile).toHaveBeenCalledWith(
      '2026-10-14-Morning-Run.gpx',
      file,
    );
    expect(button()?.getAttribute('aria-label')).toBe('activity_gpx_download');
  });

  it('saves the recording as FIT', async () => {
    state.stream = { time: [0, 1], watts: [200, 210] };
    const file = new Blob([new Uint8Array([14])]);
    state.getEventFit.mockResolvedValue(file);
    render();
    await act(async () => (fitButton() as HTMLButtonElement).click());
    expect(state.getEventFit).toHaveBeenCalledWith(7);
    expect(state.downloadFile).toHaveBeenCalledWith(
      '2026-10-14-Morning-Run.fit',
      file,
    );
  });
});

describe('activityFileName', () => {
  it('names the track after the local day and the activity', () => {
    expect(
      activityFileName(
        {
          name: 'Länger Lauf / Zürich!',
          // 23:30 local time stays on its day, wherever the athlete is
          startDate: new Date(2026, 0, 6, 23, 30),
        },
        'gpx',
      ),
    ).toBe('2026-01-06-Langer-Lauf-Zurich.gpx');
  });
});
