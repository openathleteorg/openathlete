import { SafeArea, SystemBarsStyle } from '@capacitor-community/safe-area';
import { StatusBar, Style } from '@capacitor/status-bar';

import { isAndroid, isCapacitor, isIOS } from './capacitor';

export async function initStatusBar() {
  if (!isCapacitor()) {
    return;
  }

  try {
    if (isIOS()) {
      await StatusBar.setOverlaysWebView({ overlay: true });
    }
    if (isAndroid()) {
      document.documentElement.setAttribute(
        'data-capacitor-platform',
        'android',
      );
    }
    await updateStatusBarStyle();
  } catch (error) {
    console.error('Status bar init failed:', error);
  }
}

export async function updateStatusBarStyle(theme?: 'light' | 'dark') {
  if (!isCapacitor()) {
    return;
  }

  const isDark =
    theme === 'dark' ||
    (!theme && document.documentElement.classList.contains('dark')) ||
    (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

  try {
    if (isIOS()) {
      await StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light,
      });
      await StatusBar.setBackgroundColor({
        color: isDark ? '#050C34' : '#ffffff',
      });
    } else if (isAndroid()) {
      await SafeArea.setSystemBarsStyle({
        style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      });
    }
  } catch (error) {
    console.error('Failed to update status bar style:', error);
  }
}
