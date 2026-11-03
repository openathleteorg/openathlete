'use client';

import { useLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { track } from '@/utils/analytics';
import {
  type SupportedLocale,
  isSupportedLocale,
  localePath,
  matchAcceptLanguage,
  toParaglideLocale,
} from '@/utils/locales';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'openathlete-locale-suggestion-dismissed';

function remember(locale: SupportedLocale) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `NEXT_LOCALE=${locale}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * URLs never change language on their own (search engines need one language
 * per URL), so a visitor whose browser prefers another of our languages gets
 * an offer to switch, written in that language.
 */
export function LocaleSuggestion() {
  const locale = useLocale();
  const pathname = usePathname();
  const [suggested, setSuggested] = useState<SupportedLocale | null>(null);

  useEffect(() => {
    if (document.cookie.includes('NEXT_LOCALE=')) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Private mode: suggest anyway
    }
    const preferred = matchAcceptLanguage(navigator.languages.join(','));
    if (preferred && preferred !== locale) setSuggested(preferred);
  }, [locale]);

  if (!suggested) return null;
  const target = toParaglideLocale(suggested);
  const segments = pathname.split('/').filter(Boolean);
  if (isSupportedLocale(segments[0])) segments.shift();
  const href = localePath(
    suggested,
    segments.length ? `/${segments.join('/')}` : '',
  );

  const dismiss = () => {
    remember(locale);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Ignored: the cookie is enough
    }
    setSuggested(null);
  };

  return (
    <div
      lang={target}
      className="relative z-50 flex items-center justify-center gap-3 bg-ink px-10 py-2 text-[0.85rem] text-white"
    >
      <span className="text-white/75">
        {m.site_suggest_text({}, { locale: target })}
      </span>
      <a
        href={href}
        onClick={() => {
          remember(suggested);
          track('language_changed', {
            from: locale,
            to: suggested,
            via: 'suggestion',
          });
        }}
        className="font-medium underline underline-offset-2 hover:no-underline"
      >
        {m.site_suggest_switch({}, { locale: target })}
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label={m.site_suggest_dismiss({}, { locale: target })}
        className="absolute right-3 grid size-7 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
