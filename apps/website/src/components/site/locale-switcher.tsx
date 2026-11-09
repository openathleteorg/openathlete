'use client';

import { useLocale, useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { track } from '@/utils/analytics';
import {
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  isSupportedLocale,
  localePath,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { Check, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/** Path of the current page without its locale prefix. */
function stripLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (isSupportedLocale(segments[0])) segments.shift();
  return segments.length ? `/${segments.join('/')}` : '';
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const ml = useMessageLocale();
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (next: SupportedLocale) => {
    setOpen(false);
    if (next === locale) return;
    // Remembered so the language suggestion banner stays away
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `NEXT_LOCALE=${next}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    track('language_changed', { from: locale, to: next });
    const path = stripLocale(pathname);
    window.location.href = localePath(next, path);
  };

  return (
    <div ref={ref} className={cn('relative flex', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={m.site_language({}, { locale: ml })}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[0.85rem] text-ink/70 transition-colors hover:bg-secondary hover:text-ink"
      >
        <Globe className="size-4" />
        <span className="font-mono text-[0.75rem] uppercase">
          {locale === 'pt-br' ? 'pt' : locale}
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full right-0 z-50 mt-2 w-52 rounded-2xl border border-border bg-white p-1.5 shadow-[0_24px_48px_-20px_rgb(5_12_52/0.35)] max-sm:right-auto max-sm:bottom-full max-sm:left-0 max-sm:top-auto max-sm:mb-2"
        >
          {SUPPORTED_LOCALES.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === locale}
                onClick={() => choose(option)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-paper"
              >
                {LOCALE_NAMES[option]}
                {option === locale && <Check className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
