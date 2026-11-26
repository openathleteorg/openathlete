// @vitest-environment jsdom
import { useProviderConnect } from '@/components/connectors/use-provider-connect';
import {
  captureAuthSession,
  clearAuthTokens,
  installAuthTokens,
  rotateAuthTokens,
} from '@/utils/auth-attempt';
import client from '@/utils/axios';
import { deferred } from '@/utils/test/deferred';
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from '@tanstack/react-query';
import type { InternalAxiosRequestConfig } from 'axios';
import { type ReactNode, act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuthCallbackPage } from './oauth-callback';

const server = vi.hoisted(() => ({ url: 'https://first.example.test/api' }));
vi.mock('@/utils/capacitor', () => ({
  getApiBaseUrl: () => server.url,
  isCapacitor: () => false,
}));

const consentUrl = 'https://provider.example.test/authorize?client_id=example';
const bearer = (name: string) =>
  `header.${btoa(JSON.stringify({ exp: 4102444800, name }))}.signature`;

function Connect() {
  const { connect, connectCoros, corosRegionOpen } =
    useProviderConnect('onboarding');
  return (
    <>
      <button onClick={() => connect('GARMIN')}>Connect Garmin</button>
      <button onClick={() => connect('COROS')}>Connect COROS</button>
      {corosRegionOpen && (
        <button onClick={() => connectCoros('eu')}>Select Europe</button>
      )}
    </>
  );
}

function callbackPath(provider: string, url: string | URL) {
  const search = new URLSearchParams({ code: 'provider-code' });
  const state = new URL(url).searchParams.get('state');
  if (state) search.set('state', state);
  return `/auth/callback/${provider}?${search}`;
}

describe('provider OAuth ownership', () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;
  let exchanges: InternalAxiosRequestConfig[];
  let requested: string[];
  let authorization: ReturnType<
    typeof deferred<{ uri: string; codeVerifier: string }>
  >;
  let originalAdapter: typeof client.defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    server.url = 'https://first.example.test/api';
    installAuthTokens(bearer('initial'), 'refresh-initial');
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    exchanges = [];
    requested = [];
    authorization = deferred();
    vi.spyOn(window, 'open').mockReturnValue(null);
    originalAdapter = client.defaults.adapter;
    client.defaults.adapter = async (config) => {
      if (config.method === 'get') requested.push(config.url ?? '');
      if (config.method === 'post') exchanges.push(config);
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: config.method === 'get' ? await authorization.promise : {},
      };
    };
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    queryClient.clear();
    onlineManager.setOnline(true);
    client.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const render = async (node: ReactNode) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
      ),
    );
  };

  const click = async (label: string) => {
    await act(async () =>
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === label)
        ?.click(),
    );
  };

  const renderCallback = async (path: string) => {
    await render(
      <MemoryRouter key={path} initialEntries={[path]}>
        <Routes>
          <Route
            path="/auth/callback/:provider"
            element={<OAuthCallbackPage />}
          />
          <Route path="*" element={<span>Returned to OpenAthlete</span>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  const showCallback = async (path: string) => {
    await renderCallback(path);
    await vi.waitFor(() =>
      expect(container.textContent).toBe('Returned to OpenAthlete'),
    );
  };

  const launch = async (
    provider = 'Garmin',
    codeVerifier = 'provider-verifier',
  ) => {
    const callCount = vi.mocked(window.open).mock.calls.length;
    await render(<Connect />);
    await click(`Connect ${provider}`);
    if (provider === 'COROS') await click('Select Europe');
    await act(async () =>
      authorization.resolve({ uri: consentUrl, codeVerifier }),
    );
    await vi.waitFor(() =>
      expect(window.open).toHaveBeenCalledTimes(callCount + 1),
    );
    return vi.mocked(window.open).mock.calls[callCount][0]!;
  };

  it.each(['logout', 'another login', 'server switch'])(
    'ignores a pending Garmin callback after %s',
    async (change) => {
      const url = await launch();
      if (change === 'logout') clearAuthTokens(captureAuthSession());
      else if (change === 'another login')
        installAuthTokens(bearer('successor'));
      else server.url = 'https://second.example.test/api';
      if (change !== 'server switch') {
        expect(
          Object.values(localStorage).some((value) =>
            value.includes('provider-verifier'),
          ),
        ).toBe(false);
      }

      await showCallback(callbackPath('GARMIN', url));

      expect(exchanges).toEqual([]);
    },
  );

  it('does not launch consent if the initiating account changed during URI retrieval', async () => {
    await render(<Connect />);
    await click('Connect Garmin');
    await vi.waitFor(() => expect(requested).toHaveLength(1));
    installAuthTokens(bearer('successor'));

    await act(async () =>
      authorization.resolve({
        uri: consentUrl,
        codeVerifier: 'retired-verifier',
      }),
    );

    expect(window.open).not.toHaveBeenCalled();
    expect(
      Object.values(localStorage).some((value) =>
        value.includes('retired-verifier'),
      ),
    ).toBe(false);
  });

  it('keeps the new Garmin verifier when the previous callback arrives first', async () => {
    const oldUrl = await launch('Garmin', 'old-verifier');
    authorization = deferred();
    const newUrl = await launch('Garmin', 'new-verifier');
    expect(
      Object.values(localStorage).some((value) =>
        value.includes('old-verifier'),
      ),
    ).toBe(false);

    await showCallback(callbackPath('GARMIN', oldUrl));
    expect(exchanges).toEqual([]);

    await showCallback(callbackPath('GARMIN', newUrl));
    expect(exchanges).toHaveLength(1);
    expect(JSON.parse(String(exchanges[0].data)).codeVerifier).toBe(
      'new-verifier',
    );
  });

  it('keeps a paused callback exchange bound to the account that queued it', async () => {
    const url = await launch();
    onlineManager.setOnline(false);
    await renderCallback(callbackPath('GARMIN', url));
    expect(
      queryClient
        .getMutationCache()
        .getAll()
        .some((mutation) => mutation.state.isPaused),
    ).toBe(true);

    installAuthTokens(bearer('successor'));
    await act(async () => {
      onlineManager.setOnline(true);
      await queryClient.resumePausedMutations();
    });

    expect(queryClient.isMutating()).toBe(0);
    expect(exchanges).toEqual([]);
  });

  it('exchanges a matching COROS callback with credentials refreshed for the same owner', async () => {
    const url = await launch('COROS');
    const refreshed = bearer('rotated');
    rotateAuthTokens(captureAuthSession(), refreshed);

    await showCallback(callbackPath('COROS', url));

    expect(exchanges).toHaveLength(1);
    expect(exchanges[0].headers.Authorization).toBe(`Bearer ${refreshed}`);
    expect(exchanges[0].baseURL).toBe('https://first.example.test/api');
    expect(JSON.parse(String(exchanges[0].data))).toEqual({
      code: 'provider-code',
      codeVerifier: 'provider-verifier',
    });
  });

  it.each(['GARMIN', 'COROS'])(
    'ignores an unscoped %s verifier left by an older version',
    async (provider) => {
      localStorage.setItem(
        `oauth_code_verifier_${provider}`,
        'legacy-verifier',
      );

      await showCallback(`/auth/callback/${provider}?code=provider-code`);

      expect(exchanges).toEqual([]);
      expect(
        localStorage.getItem(`oauth_code_verifier_${provider}`),
      ).toBeNull();
    },
  );
});
