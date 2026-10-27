// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TrainingEvent } from '@openathlete/shared';

import { ZwiftSettings } from './zwift-settings';
import { ZwiftSync } from './zwift-sync';
import { ZwiftWorkoutAction } from './zwift-workout-action';

const mock = vi.hoisted(() => ({
  native: true,
  account: 42,
  connected: false,
  status: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  upload: vi.fn(),
  events: vi.fn(),
  event: vi.fn(),
  metrics: vi.fn(),
  athlete: vi.fn(),
}));
vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ user: { userId: mock.account } }),
}));
vi.mock('@/utils/capacitor', () => ({
  getApiBaseUrl: () => 'https://training.example.org/api',
}));
vi.mock('@/utils/zwift', () => ({
  hasLocalZwift: () => mock.native,
  localZwift: {
    status: mock.status,
    connect: mock.connect,
    disconnect: mock.disconnect,
    upload: mock.upload,
  },
}));
vi.mock('@/api/event/event.api', () => ({
  EventAPI: { getMyEvents: mock.events, getEvent: mock.event },
}));
vi.mock('@/api/athlete/athlete.api', () => ({
  AthleteAPI: { getMyAthlete: mock.athlete },
}));
vi.mock('@/api/metric/metric.api', () => ({
  MetricAPI: { getLatestMetrics: mock.metrics },
}));
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_, key) => () => String(key) }),
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const flush = () => new Promise((resolve) => setTimeout(resolve, 15));
describe('Zwift iPhone settings and sync', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  const render = async (element: React.ReactNode) => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter>{element}</MemoryRouter>
        </QueryClientProvider>,
      );
      await flush();
    });
    await act(flush);
  };
  const click = async (text: string) => {
    const button = [...container.querySelectorAll('button')].find(
      (item) => item.textContent === text,
    )!;
    await act(async () => {
      button.click();
      await flush();
    });
    await act(flush);
  };
  beforeEach(() => {
    vi.resetAllMocks();
    mock.native = true;
    mock.connected = false;
    mock.account = 42;
    mock.status.mockImplementation(async () => ({ connected: mock.connected }));
    mock.connect.mockImplementation(async () => {
      mock.connected = true;
      return { connected: true };
    });
    mock.disconnect.mockImplementation(async () => {
      mock.connected = false;
    });
    mock.upload.mockResolvedValue({ verified: true });
    mock.athlete.mockResolvedValue({ athleteId: 17 });
    mock.events.mockResolvedValue([]);
    mock.metrics.mockResolvedValue({});
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });
  afterEach(async () => {
    await act(() => root.unmount());
    client.clear();
    container.remove();
  });
  it('sends credentials only to the native connection and clears the password input', async () => {
    await render(<ZwiftSettings />);
    const username =
      container.querySelector<HTMLInputElement>('[name=username]')!;
    const password =
      container.querySelector<HTMLInputElement>('[name=password]')!;
    username.value = 'test@example.org';
    password.value = 'not-a-real-password';
    await act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        );
      await flush();
    });
    await act(flush);
    expect(mock.connect).toHaveBeenCalledWith({
      apiBaseURL: 'https://training.example.org/api',
      accountID: '42',
      username: 'test@example.org',
      password: 'not-a-real-password',
    });
    expect(password.value).toBe('');
    expect(container.textContent).toContain('zwift_connected');
    expect(
      JSON.stringify(
        client
          .getQueryCache()
          .getAll()
          .map((query) => query.state.data),
      ),
    ).not.toContain('password');
    await click('zwift_disconnect');
    expect(mock.disconnect).toHaveBeenCalledOnce();
  });
  it('stays hidden on web and never requests Zwift or plan data', async () => {
    mock.native = false;
    await render(
      <>
        <ZwiftSettings />
        <ZwiftSync />
      </>,
    );
    expect(container.textContent).toBe('');
    expect(mock.status).not.toHaveBeenCalled();
    expect(mock.events).not.toHaveBeenCalled();
  });
  it('uploads the selected current-day workout and only reports verified success', async () => {
    mock.connected = true;
    const planned = {
      eventId: 9,
      athleteId: 17,
      type: 'TRAINING',
      sport: 'CYCLING',
      startDate: new Date(),
      name: 'Today',
      description: '',
      workout: {
        steps: [
          {
            orderIndex: 0,
            stepType: 'FREE',
            durationType: 'TIME',
            durationValue: 120,
            targets: [],
          },
        ],
      },
    };
    mock.events.mockResolvedValue([planned]);
    mock.event.mockResolvedValue(planned);
    await render(<ZwiftSync />);
    await click('zwift_send');
    expect(mock.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        eventID: 9,
        accountID: '42',
        xml: expect.stringContaining('FreeRide Duration="120"'),
      }),
    );
    expect(container.textContent).toContain('zwift_uploaded');
    mock.upload.mockRejectedValueOnce({ code: 'ZWIFT_VERIFY_FAILED' });
    await click('zwift_send');
    expect(container.textContent).toContain('zwift_verify_failed');
    expect(container.textContent).not.toContain('zwift_uploaded');
  });
  it('does not send a workout that changed to another day', async () => {
    mock.connected = true;
    const planned = {
      eventId: 9,
      athleteId: 17,
      type: 'TRAINING',
      sport: 'CYCLING',
      startDate: new Date(),
      name: 'Today',
    };
    mock.events.mockResolvedValue([planned]);
    mock.event.mockResolvedValue({
      ...planned,
      startDate: new Date(2000, 1, 1),
    });
    await render(<ZwiftSync />);
    await click('zwift_send');
    expect(mock.upload).not.toHaveBeenCalled();
    expect(container.textContent).toContain('zwift_failed');
  });
  it('offers the same verified upload directly on a future planned workout', async () => {
    mock.connected = true;
    const planned = {
      eventId: 10,
      athleteId: 17,
      type: 'TRAINING',
      sport: 'CYCLING',
      startDate: new Date(Date.now() + 86400000),
      name: 'Tomorrow',
      description: '',
      workout: {
        steps: [
          {
            orderIndex: 0,
            stepType: 'FREE',
            durationType: 'TIME',
            durationValue: 120,
            targets: [],
          },
        ],
      },
    } as unknown as TrainingEvent;
    mock.event.mockResolvedValue(planned);
    await render(<ZwiftWorkoutAction event={planned} />);
    await click('zwift_send');
    expect(mock.upload).toHaveBeenCalledWith(
      expect.objectContaining({ eventID: 10 }),
    );
    expect(container.textContent).toContain('zwift_uploaded');
  });
  it('does not offer the personal Zwift account on another athlete’s workout', async () => {
    mock.connected = true;
    const planned = {
      eventId: 10,
      athleteId: 99,
      type: 'TRAINING',
      sport: 'CYCLING',
      name: 'Coached athlete',
    } as unknown as TrainingEvent;
    await render(<ZwiftWorkoutAction event={planned} />);
    expect(container.textContent).toBe('');
    expect(mock.upload).not.toHaveBeenCalled();
  });
});
