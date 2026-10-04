import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

/**
 * Caching rules of the service worker (public/sw.js), run with in-memory
 * caches and a fake network. The test lives here rather than next to sw.js
 * because everything in public/ is copied as is into the build.
 */
const source = readFileSync(join(__dirname, '../../public/sw.js'), 'utf8');
const ORIGIN = 'https://app.example.test';

type FakeResponse = { ok: boolean; type: string; body: string };
type FakeRequest = string | { url: string };
type Listener = (event: Record<string, unknown>) => void;

function setup() {
  const stores = new Map<string, Map<string, FakeResponse>>();
  let online = true;
  const requests: string[] = [];
  const network = async (request: FakeRequest) => {
    const url = typeof request === 'string' ? request : request.url;
    requests.push(url);
    if (!online) throw new TypeError('Failed to fetch');
    return {
      ok: true,
      type: 'basic',
      body: `network:${url}`,
      clone() {
        return { ...this };
      },
    };
  };
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    const key = (request: FakeRequest) =>
      new URL(typeof request === 'string' ? request : request.url, ORIGIN).href;
    return {
      add: async (request: FakeRequest) =>
        store.set(key(request), await network(request)),
      put: async (request: FakeRequest, response: FakeResponse) =>
        store.set(key(request), response),
      match: async (request: FakeRequest) => store.get(key(request)),
      keys: async () => [...store.keys()],
      delete: async (request: FakeRequest) => store.delete(key(request)),
    };
  };
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (request: FakeRequest, { cacheName }: { cacheName: string }) =>
      (await open(cacheName)).match(request),
  };
  const listeners: Record<string, Listener> = {};
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) =>
      (listeners[type] = listener),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  vm.runInNewContext(source, {
    self,
    caches,
    fetch: network,
    Request: class {
      constructor(public url: string) {}
    },
    URL,
    Promise,
    Math,
  });
  const dispatch = async (
    type: string,
    event: Record<string, unknown> = {},
  ): Promise<FakeResponse | undefined> => {
    const pending: Promise<unknown>[] = [];
    let response: Promise<FakeResponse> | undefined;
    listeners[type]({
      ...event,
      waitUntil: (promise: Promise<unknown>) => pending.push(promise),
      respondWith: (promise: Promise<FakeResponse>) => (response = promise),
    });
    await Promise.all(pending);
    const result = await response;
    await Promise.all(pending);
    return result;
  };
  const fetchEvent = (path: string, extra: Record<string, unknown> = {}) =>
    dispatch('fetch', {
      request: { method: 'GET', url: ORIGIN + path, mode: 'cors', ...extra },
    });
  return {
    stores,
    requests,
    dispatch,
    fetchEvent,
    setOnline: (value: boolean) => (online = value),
  };
}

describe('service worker', () => {
  it('installs the app shell and drops caches of older versions', async () => {
    const sw = setup();
    sw.stores.set('openathlete-shell-v0', new Map());
    sw.stores.set('unrelated-cache', new Map());
    await sw.dispatch('install');
    await sw.dispatch('activate');
    expect([...sw.stores.keys()].sort()).toEqual([
      'openathlete-shell-v1',
      'unrelated-cache',
    ]);
    expect(
      sw.stores.get('openathlete-shell-v1')!.has(ORIGIN + '/index.html'),
    ).toBe(true);
  });

  it('loads pages from the network and falls back to the shell offline', async () => {
    const sw = setup();
    await sw.dispatch('install');
    const page = await sw.fetchEvent('/dashboard/calendar', {
      mode: 'navigate',
    });
    expect(page?.body).toBe(`network:${ORIGIN}/dashboard/calendar`);

    sw.setOnline(false);
    const offline = await sw.fetchEvent('/dashboard/calendar', {
      mode: 'navigate',
    });
    expect(offline?.body).toBe('network:/index.html');
  });

  it('fetches hashed build files once, then serves them from the cache', async () => {
    const sw = setup();
    const first = await sw.fetchEvent('/assets/index-abc123.js');
    sw.setOnline(false);
    const second = await sw.fetchEvent('/assets/index-abc123.js');
    expect(second?.body).toBe(first?.body);
    expect(
      sw.requests.filter((url) => url.endsWith('index-abc123.js')),
    ).toHaveLength(1);
  });

  it('never intercepts API calls, other origins or writes', async () => {
    const sw = setup();
    for (const [path, extra] of [
      ['/api/events', {}],
      ['/socket.io/?EIO=4', {}],
      ['/assets/index-abc123.js', { method: 'POST' }],
    ] as const)
      expect(await sw.fetchEvent(path, extra)).toBeUndefined();
    expect(
      await sw.dispatch('fetch', {
        request: {
          method: 'GET',
          url: 'https://api.example.test/assets/x.js',
          mode: 'cors',
        },
      }),
    ).toBeUndefined();
    expect(sw.requests).toHaveLength(0);
  });
});
