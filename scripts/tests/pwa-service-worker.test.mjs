/**
 * Service worker caching rules (apps/web/public/sw.js) with in-memory caches
 * and a fake network. Run: node --test scripts/tests/pwa-service-worker.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(
  new URL("../../apps/web/public/sw.js", import.meta.url),
  "utf8",
);
const ORIGIN = "https://app.example.test";

function setup() {
  const stores = new Map();
  const open = async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    const key = (request) =>
      new URL(typeof request === "string" ? request : request.url, ORIGIN)
        .href;
    return {
      add: async (request) => store.set(key(request), await network(request)),
      put: async (request, response) => store.set(key(request), response),
      match: async (request) => store.get(key(request)),
      keys: async () => [...store.keys()],
      delete: async (request) => store.delete(key(request)),
    };
  };
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (request, { cacheName }) =>
      (await open(cacheName)).match(request),
  };
  let online = true;
  const requests = [];
  const network = async (request) => {
    const url = typeof request === "string" ? request : request.url;
    requests.push(url);
    if (!online) throw new TypeError("Failed to fetch");
    return {
      ok: true,
      type: "basic",
      body: `network:${url}`,
      clone() {
        return { ...this };
      },
    };
  };
  const listeners = {};
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, listener) => (listeners[type] = listener),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  vm.runInNewContext(source, {
    self,
    caches,
    fetch: network,
    Request: class {
      constructor(url) {
        this.url = url;
      }
    },
    URL,
    Promise,
    Math,
  });
  const dispatch = async (type, event = {}) => {
    const pending = [];
    let response;
    listeners[type]({
      ...event,
      waitUntil: (promise) => pending.push(promise),
      respondWith: (promise) => (response = promise),
    });
    await Promise.all(pending);
    const result = await response;
    await Promise.all(pending);
    return result;
  };
  const fetchEvent = (path, extra = {}) =>
    dispatch("fetch", {
      request: { method: "GET", url: ORIGIN + path, mode: "cors", ...extra },
    });
  return {
    stores,
    requests,
    dispatch,
    fetchEvent,
    setOnline: (value) => (online = value),
  };
}

test("installs the app shell and drops caches of older versions", async () => {
  const sw = setup();
  sw.stores.set("openathlete-shell-v0", new Map());
  sw.stores.set("unrelated-cache", new Map());
  await sw.dispatch("install");
  await sw.dispatch("activate");
  assert.deepEqual(
    [...sw.stores.keys()].sort(),
    ["openathlete-shell-v1", "unrelated-cache"],
  );
  assert.ok(sw.stores.get("openathlete-shell-v1").has(ORIGIN + "/index.html"));
});

test("pages come from the network and fall back to the shell offline", async () => {
  const sw = setup();
  await sw.dispatch("install");
  const page = await sw.fetchEvent("/dashboard/calendar", { mode: "navigate" });
  assert.equal(page.body, `network:${ORIGIN}/dashboard/calendar`);

  sw.setOnline(false);
  const offline = await sw.fetchEvent("/dashboard/calendar", {
    mode: "navigate",
  });
  assert.equal(offline.body, "network:/index.html");
});

test("hashed build files are fetched once, then served from the cache", async () => {
  const sw = setup();
  const first = await sw.fetchEvent("/assets/index-abc123.js");
  sw.setOnline(false);
  const second = await sw.fetchEvent("/assets/index-abc123.js");
  assert.equal(second.body, first.body);
  assert.equal(
    sw.requests.filter((url) => url.endsWith("index-abc123.js")).length,
    1,
  );
});

test("API calls, other origins and writes are never intercepted", async () => {
  const sw = setup();
  for (const [path, extra] of [
    ["/api/events", {}],
    ["/socket.io/?EIO=4", {}],
    ["/assets/index-abc123.js", { method: "POST" }],
  ])
    assert.equal(await sw.fetchEvent(path, extra), undefined);
  assert.equal(
    await sw.dispatch("fetch", {
      request: {
        method: "GET",
        url: "https://api.example.test/assets/x.js",
        mode: "cors",
      },
    }),
    undefined,
  );
  assert.equal(sw.requests.length, 0);
});
