import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getLocaleName } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { Globe } from 'lucide-react';
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
  const currentLocale: SupportedLocale = SUPPORTED_LOCALES.includes(
    locale as SupportedLocale,
  )
    ? (locale as SupportedLocale)
    : 'en';
  const { syncLanguage } = useLanguageSync();

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
            onClick={() => syncLanguage(locale)}
            className={cn({ 'font-bold': currentLocale === locale })}
          >
            {getLocaleName(locale)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
