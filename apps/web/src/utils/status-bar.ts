import { StatusBar, Style } from '@capacitor/status-bar';

import { isCapacitor } from './capacitor';

export async function initStatusBar() {
  if (!isCapacitor()) {
    return;
  }

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await updateStatusBarStyle();
  } catch (error) {
    console.warn('StatusBar plugin not available:', error);
  }
}

export async function updateStatusBarStyle(theme?: 'light' | 'dark') {
  if (!isCapacitor()) {
    return;
  }

  try {
    const isDark =
      theme === 'dark' ||
      (!theme && document.documentElement.classList.contains('dark')) ||
      (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });

    await StatusBar.setBackgroundColor({
      color: isDark ? '#050C34' : '#ffffff',
    });
  } catch (error) {
    console.warn('Failed to update status bar style:', error);
  }
}
