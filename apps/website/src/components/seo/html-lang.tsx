'use client';

import { useEffect } from 'react';

interface HtmlLangProps {
  locale: string;
}

/**
 * Component to set the HTML lang attribute dynamically based on locale
 * This ensures proper SEO and accessibility
 */
export function HtmlLang({ locale }: HtmlLangProps) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const htmlLang = locale === 'fr' ? 'fr' : 'en';
      document.documentElement.lang = htmlLang;
    }
  }, [locale]);

  return null;
}
