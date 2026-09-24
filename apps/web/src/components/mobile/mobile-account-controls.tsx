import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuthContext } from '@/contexts/auth';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getPath } from '@/routes/paths';
import { SUPPORTED_LOCALES, getLocaleName } from '@/utils/locales';
import { LogOut, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link, useNavigate } from 'react-router-dom';

/** Touch-friendly account actions without nested hover menus. */
export function MobileAccountControls() {
  const { user, logout } = useAuthContext();
  const { setOpenMobile } = useSidebar();
  const { syncLanguage } = useLanguageSync();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div className="space-y-2 border-t px-2 pt-3 pb-1">
      <p className="truncate text-sm font-medium">
        {user.firstName} {user.lastName}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0 text-xs">
          {m.language()}
          <select
            aria-label={m.language_switcher_label()}
            className="mt-1 h-11 w-full rounded-md border bg-background px-2 text-base text-foreground"
            value={getLocale()}
            onChange={(event) => {
              const locale = SUPPORTED_LOCALES.find(
                (value) => value === event.target.value,
              );
              if (locale) void syncLanguage(locale);
            }}
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <option key={locale} value={locale}>
                {getLocaleName(locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-xs">
          {m.theme()}
          <select
            className="mt-1 h-11 w-full rounded-md border bg-background px-2 text-base text-foreground"
            value={theme ?? 'system'}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="light">{m.theme_light()}</option>
            <option value="dark">{m.theme_dark()}</option>
            <option value="system">{m.theme_system()}</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" className="h-11 min-w-0 flex-1">
          <Link
            to={getPath(['dashboard', 'settings'])}
            onClick={() => setOpenMobile(false)}
          >
            <Settings className="size-4" />
            {m.settings()}
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label={m.log_out()}
          onClick={() => {
            setOpenMobile(false);
            logout((path) => navigate(path, { replace: true }));
          }}
        >
          <LogOut className="size-5" />
        </Button>
      </div>
    </div>
  );
}
