import { getLocale, setLocale } from '@/paraglide/runtime';

export function LanguageSwitcher() {
  const current = getLocale();
  const other = current === 'fr' ? 'en' : 'fr';
  return (
    <button
      type="button"
      aria-label="Switch language"
      onClick={() => setLocale(other as 'en' | 'fr')}
      className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-[var(--oa-muted)] hover:text-[var(--oa-fg)] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oa-accent)] cursor-pointer"
    >
      {current.toUpperCase()}
    </button>
  );
}
