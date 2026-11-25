// @vitest-environment jsdom
import { installAuthTokens } from '@/utils/auth-attempt';
import client from '@/utils/axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/utils/local-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useExchangeOidcCodeMutation,
  useLoginMutation,
  useLoginWithFirebaseMutation,
} from './auth.hooks';

const capacitor = vi.hoisted(() => ({
  apiBaseUrl: 'https://api-a.example.org',
}));
vi.mock('@/utils/capacitor', () => ({
  getApiBaseUrl: () => capacitor.apiBaseUrl,
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type Pending = {
  config: InternalAxiosRequestConfig;
  respond: (accessToken: string) => void;
  reject: (status: number) => void;
};
const pending: Pending[] = [];

function LoginProbe({ onSuccess }: { onSuccess: (name: string) => void }) {
  const email = useLoginMutation({ onSuccess: () => onSuccess('email') });
  const firebase = useLoginWithFirebaseMutation({
    onSuccess: () => onSuccess('firebase'),
  });
  const oidc = useExchangeOidcCodeMutation({
    onSuccess: () => onSuccess('oidc'),
  });
  return (
    <>
      <button
        onClick={() =>
          email.mutate({ email: 'a@example.org', password: 'secret' })
        }
      >
        email
      </button>
      <button onClick={() => firebase.mutate({ idToken: 'firebase-a' })}>
        firebase
      </button>
      <button
        onClick={() =>
          oidc.mutate({ code: '00000000-0000-4000-8000-000000000000' })
        }
      >
        oidc
      </button>
    </>
  );
}

const respond = async (request: Pending, token: string) => {
  request.respond(token);
  await Promise.resolve();
  await Promise.resolve();
};

describe('auth login hooks', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    capacitor.apiBaseUrl = 'https://api-a.example.org';
    pending.length = 0;
    client.defaults.adapter = async (config) =>
      new Promise<AxiosResponse>((resolve, reject) => {
        pending.push({
          config,
          respond: (accessToken) =>
            resolve({
              data: {
                accessToken,
                refreshToken: `refresh-${accessToken}`,
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            }),
          reject: (status) =>
            reject(
              new AxiosError(
                `HTTP ${status}`,
                AxiosError.ERR_BAD_REQUEST,
                config,
                null,
                {
                  status,
                  statusText: '',
                  data: {},
                  headers: {},
                  config,
                },
              ),
            ),
        });
      });
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
  });

  const render = async (onSuccess: (name: string) => void) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <LoginProbe onSuccess={onSuccess} />
        </QueryClientProvider>,
      ),
    );
  };

  const click = async (label: string) => {
    await act(async () => {
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === label)!
        .click();
    });
  };

  const bodyOf = (request: Pending) =>
    JSON.parse(String(request.config.data)) as Record<string, unknown>;
  const requestWith = (field: string) =>
    pending.find((request) => field in bodyOf(request))!;

  it('lets only the newest-started login commit when responses arrive out of order', async () => {
    const successes: string[] = [];
    await render((name) => successes.push(name));

    await click('email');
    await click('firebase');
    await vi.waitFor(() => expect(pending).toHaveLength(2));

    // The second login answers first, then the first answers late.
    await act(async () => respond(requestWith('idToken'), 'token-b'));
    await vi.waitFor(() =>
      expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b'),
    );
    await act(async () => respond(requestWith('email'), 'token-a'));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('refresh-token-b');
    expect(successes).toEqual(['firebase']);
  });

  it('pins login dispatch to the owner captured at invocation', async () => {
    const successes: string[] = [];
    await render((name) => successes.push(name));
    // A real access token, so the login request does not try to refresh it.
    const successor = `header.${btoa(JSON.stringify({ exp: 4102444800 }))}.sig`;

    await act(async () => {
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === 'email')!
        .click();
      // A newer session wins before React Query runs the mutation function.
      installAuthTokens(successor, 'refresh-b');
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // The old login must not dispatch at all, let alone with B's bearer.
    expect(pending).toHaveLength(0);
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe(successor);
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('refresh-b');
    expect(successes).toEqual([]);
  });

  it('does not clear a successor session when an older login is refused', async () => {
    const successes: string[] = [];
    await render((name) => successes.push(name));

    await click('email');
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    const successor = `header.${btoa(JSON.stringify({ exp: 4102444800 }))}.sig`;
    installAuthTokens(successor, 'refresh-b');

    pending[0].reject?.(401);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(localStorage.getItem(ACCESS_TOKEN)).toBe(successor);
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('refresh-b');
    expect(successes).toEqual([]);
  });

  it('does not commit when the API instance changed while the login was pending', async () => {
    const successes: string[] = [];
    await render((name) => successes.push(name));

    await click('email');
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    capacitor.apiBaseUrl = 'https://api-b.example.org';
    await act(async () => respond(requestWith('email'), 'token-a'));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
    expect(successes).toEqual([]);
  });

  it('rejects a login that started against another API instance', async () => {
    const successes: string[] = [];
    await render((name) => successes.push(name));

    await click('oidc');
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    const oidc = requestWith('code');
    expect(oidc.config.baseURL).toBe('https://api-a.example.org');

    capacitor.apiBaseUrl = 'https://api-b.example.org';
    await click('email');
    await vi.waitFor(() => expect(pending).toHaveLength(2));

    await act(async () => respond(requestWith('email'), 'token-b'));
    await vi.waitFor(() =>
      expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b'),
    );
    await act(async () => respond(oidc, 'token-a'));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('token-b');
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('refresh-token-b');
    expect(successes).toEqual(['email']);
  });
});
