import { useSyncExternalStore } from 'react';

import { isCapacitor } from './capacitor';

/** Chrome/Edge/Samsung Internet install prompt (not in the DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone/iPad browsers only install through Share → Add to Home Screen. */
export function isIosBrowser() {
  const iPadOs =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || iPadOs;
}

/**
 * Registers the service worker (production web build only, never inside the
 * Capacitor apps) and keeps the browser's install prompt for the install menu.
 * Call once at startup: the prompt event can fire before React mounts.
 */
export function initPwa() {
  if (typeof window === 'undefined' || isCapacitor()) return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    notify();
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator)
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // The app works the same without it; only install/offline are lost.
      });
    });
}

/** Shows the browser's install dialog; false when none is available. */
export async function promptInstall() {
  const prompt = installPrompt;
  if (!prompt) return false;
  installPrompt = null;
  notify();
  await prompt.prompt();
  return (await prompt.userChoice).outcome === 'accepted';
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * How the app can be installed here: 'prompt' (browser dialog), 'ios'
 * (manual steps) or null (already installed, native app or unsupported).
 */
export function useInstallMethod(): 'prompt' | 'ios' | null {
  const canPrompt = useSyncExternalStore(subscribe, () => !!installPrompt);
  if (isCapacitor() || isStandalone()) return null;
  if (canPrompt) return 'prompt';
  return isIosBrowser() ? 'ios' : null;
}
