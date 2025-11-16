import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getLocale, setLocale } from '@/paraglide/runtime';
import { getLocaleName } from '@/utils/locales';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const currentLocale = getLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Switch language">
          <Globe className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">
            {getLocaleName(currentLocale)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(['en', 'fr'] as const).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => {
              setLocale(lang);
            }}
            className={currentLocale === lang ? 'font-bold' : ''}
          >
            {getLocaleName(lang)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
