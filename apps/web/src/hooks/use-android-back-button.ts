import { isAndroid } from '@/utils/capacitor';
import { App } from '@capacitor/app';
import { useEffect, useRef } from 'react';

/** Closes what is open, then goes back, then leaves from the first screen. */
export function useAndroidBackButton(atRoot: boolean, goBack: () => void) {
  const latest = useRef({ atRoot, goBack });
  latest.current = { atRoot, goBack };

  useEffect(() => {
    if (!isAndroid()) return;
    const listener = App.addListener('backButton', () => {
      const overlay = document.querySelector(
        '[role="dialog"][data-state="open"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]',
      );
      if (overlay) {
        overlay.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        );
      } else if (latest.current.atRoot) {
        void App.exitApp();
      } else {
        latest.current.goBack();
      }
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);
}
