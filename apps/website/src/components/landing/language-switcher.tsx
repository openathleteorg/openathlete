'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { m } from '@/paraglide/messages';
import { getLocale, setLocale } from '@/paraglide/runtime';
import { getLocaleName } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ComponentProps } from 'react';

type ButtonVariant = ComponentProps<typeof Button>['variant'];
type ButtonSize = ComponentProps<typeof Button>['size'];

const SUPPORTED_LOCALES = ['en', 'fr'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

interface LanguageSwitcherProps {
  className?: string;
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  showLabelOnMobile?: boolean;
}

export function LanguageSwitcher({
  className,
  buttonVariant = 'ghost',
  buttonSize = 'sm',
  showLabelOnMobile = false,
}: LanguageSwitcherProps) {
  const locale = getLocale();
  const pathname = usePathname();
  const currentLocale: SupportedLocale = SUPPORTED_LOCALES.includes(
    locale as SupportedLocale,
  )
    ? (locale as SupportedLocale)
    : 'en';

  const handleLanguageChange = (newLocale: SupportedLocale) => {
    // Don't do anything if already on this locale
    if (newLocale === currentLocale) {
      return;
    }

    // Extract current path without locale
    const pathSegments = pathname.split('/').filter(Boolean);
    const hasLocale = SUPPORTED_LOCALES.includes(
      pathSegments[0] as SupportedLocale,
    );
    const pathWithoutLocale = hasLocale ? pathSegments.slice(1) : pathSegments;

    // Always use explicit locale in URL to avoid middleware rewriting
    // Build new URL with new locale prefix
    const newPath =
      pathWithoutLocale.length > 0
        ? `/${newLocale}/${pathWithoutLocale.join('/')}`
        : `/${newLocale}`;

    // Set locale before navigation
    setLocale(newLocale);

    // Use window.location for full page navigation to ensure middleware processes it correctly
    window.location.href = newPath;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={className}
          aria-label={m.language_switcher_label()}
        >
          <Globe className="h-4 w-4" />
          <span
            className={cn('ml-2', {
              'hidden sm:inline': !showLabelOnMobile,
            })}
          >
            {getLocaleName(currentLocale)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className={cn({ 'font-bold': currentLocale === locale })}
          >
            {getLocaleName(locale)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
