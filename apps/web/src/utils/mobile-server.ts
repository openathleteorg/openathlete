import { Capacitor } from '@capacitor/core';

import { MOBILE_SERVER_URL } from './local-storage';

export const CLOUD_API_URL = 'https://api.openathlete.org';
const OPEN_SERVER_SELECTION = 'openathlete:open-server-selection';

export function getSelectedServerUrl(): string | null {
  if (!Capacitor.isNativePlatform() || typeof localStorage === 'undefined')
    return null;
  return localStorage.getItem(MOBILE_SERVER_URL);
}

export function hasSelectedServer(): boolean {
  return getSelectedServerUrl() !== null;
}

export function openServerSelection(): void {
  window.dispatchEvent(new Event(OPEN_SERVER_SELECTION));
}

export function onOpenServerSelection(listener: () => void): () => void {
  window.addEventListener(OPEN_SERVER_SELECTION, listener);
  return () => window.removeEventListener(OPEN_SERVER_SELECTION, listener);
}

/** Accept an instance URL or an explicit API URL. */
export function serverUrlCandidates(input: string): string[] {
  const url = new URL(input.trim());
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('invalid_server_url');
  }
  const path = url.pathname.replace(/\/+$/, '');
  if (path && path !== '/api') throw new Error('invalid_server_url');
  return path === '/api'
    ? [`${url.origin}/api`]
    : [`${url.origin}/api`, url.origin];
}

export async function resolveServerUrl(input: string): Promise<string> {
  for (const candidate of serverUrlCandidates(input)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${candidate}/instance`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (response.ok) {
        const instance = await response.json();
        if (instance && typeof instance === 'object' && 'signup' in instance) {
          return candidate;
        }
      }
    } catch {
      // Try the API at the origin if the instance has no /api proxy.
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('server_unreachable');
}

/** A server switch must never send the old server's token to the new one. */
export function saveSelectedServerUrl(url: string): boolean {
  const previous = getSelectedServerUrl();
  if (previous === url) return false;
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem(MOBILE_SERVER_URL, url);
  return true;
}
