'use client';

import { useTrackingConsent } from '@/utils/analytics';
import {
  attributedAppLink,
  captureLanding,
  persistLanding,
} from '@/utils/attribution';
import { useEffect } from 'react';

const EVENTS = ['click', 'auxclick', 'contextmenu'] as const;

/**
 * Adds the visit's attribution to every link into the app at the moment it
 * is used (click, middle click, copy from the context menu). Pages are
 * prerendered, so their links cannot know where the visitor came from.
 */
export function AppLinkAttribution() {
  const consent = useTrackingConsent();

  useEffect(() => {
    captureLanding();
    const decorate = (event: Event) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest('a[href]')
          : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = attributedAppLink(anchor.href);
      if (href) anchor.href = href;
    };
    for (const type of EVENTS) document.addEventListener(type, decorate, true);
    return () => {
      for (const type of EVENTS) {
        document.removeEventListener(type, decorate, true);
      }
    };
  }, []);

  useEffect(() => {
    if (consent === 'granted') persistLanding();
  }, [consent]);

  return null;
}
