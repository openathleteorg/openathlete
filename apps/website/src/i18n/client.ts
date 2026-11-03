'use client';

import {
  type ParaglideLocale,
  type SupportedLocale,
  toParaglideLocale,
} from '@/utils/locales';
import { createContext, useContext } from 'react';

/**
 * Client components are also rendered on the server, where no global locale
 * is safe to read. They take it from this context and pass it to each
 * message: `const ml = useMessageLocale(); m.key({}, { locale: ml })`.
 * (A proxy over the whole catalog would be shorter to write, but it defeats
 * tree-shaking and ships every message of every language to the browser.)
 * The provider is in ./provider.tsx.
 */
export const LocaleContext = createContext<SupportedLocale>('en');

/** URL locale: `pt-br`. */
export function useLocale(): SupportedLocale {
  return useContext(LocaleContext);
}

/** Paraglide locale, for the `locale` option of messages: `pt-BR`. */
export function useMessageLocale(): ParaglideLocale {
  return toParaglideLocale(useContext(LocaleContext));
}
