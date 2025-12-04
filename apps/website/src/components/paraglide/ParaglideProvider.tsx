'use client';

import { setLocale } from '@/paraglide/runtime.js';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ParaglideProviderProps {
  children: React.ReactNode;
  initialLocale?: string;
}

export function ParaglideProvider({
  children,
  initialLocale,
}: ParaglideProviderProps) {
  const pathname = usePathname();

  // Set locale immediately and synchronously on client
  // Priority: script variable > initialLocale > pathname > browser > default
  if (typeof window !== 'undefined') {
    let localeToSet: string;

    // First, check if locale was set via script (before React)
    if ((window as any).__PARAGLIDE_LOCALE__) {
      localeToSet = (window as any).__PARAGLIDE_LOCALE__;
    }
    // Then use initialLocale from server
    else if (initialLocale) {
      localeToSet = initialLocale;
    }
    // Extract locale from pathname
    else {
      const pathSegments = pathname.split('/').filter(Boolean);
      const localeFromPath = pathSegments[0];

      if (localeFromPath === 'fr' || localeFromPath === 'en') {
        localeToSet = localeFromPath;
      }
      // Default to browser language or 'en'
      else {
        localeToSet = navigator.language.split('-')[0] === 'fr' ? 'fr' : 'en';
      }
    }

    // Set locale synchronously during render (before children render)
    setLocale(localeToSet as 'fr' | 'en', { reload: false });
  }

  // Also update when pathname or initialLocale changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let localeToSet: string;

    if ((window as any).__PARAGLIDE_LOCALE__) {
      localeToSet = (window as any).__PARAGLIDE_LOCALE__;
    } else if (initialLocale) {
      localeToSet = initialLocale;
    } else {
      const pathSegments = pathname.split('/').filter(Boolean);
      const localeFromPath = pathSegments[0];
      localeToSet =
        localeFromPath === 'fr' || localeFromPath === 'en'
          ? localeFromPath
          : navigator.language.split('-')[0] === 'fr'
            ? 'fr'
            : 'en';
    }

    setLocale(localeToSet as 'fr' | 'en', { reload: false });
  }, [pathname, initialLocale]);

  return <>{children}</>;
}
