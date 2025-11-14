import logoDarkSrc from '@/assets/logos/logo_dark.svg';
import logoWhiteSrc from '@/assets/logos/logo_white.svg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuthContext } from '@/contexts/auth';
import { usePageActions } from '@/hooks/use-page-actions';
import { m } from '@/paraglide/messages';
import { getLocale, setLocale } from '@/paraglide/runtime';
import { getPath } from '@/routes/paths';
import { getLocaleName } from '@/utils/locales';
import { ArrowLeft, CogIcon, LogOut, Menu, MoreVertical } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocation, useNavigate } from 'react-router-dom';

import { MobileSpaceSwitcher } from './mobile-space-switcher';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

/**
 * Check if current route is a profile sub-page (statistics, records, metrics)
 */
function isProfileSubPage(pathname: string): boolean {
  const profileSubPages = [
    getPath(['dashboard', 'statistics']),
    getPath(['dashboard', 'records']),
    getPath(['dashboard', 'metrics']),
  ];
  return profileSubPages.some((route) => pathname === route);
}

export function MobileHeader({ title, showBack, onBack }: MobileHeaderProps) {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const actions = usePageActions();

  // Auto-detect if we should show back button
  const shouldShowBack = showBack ?? isProfileSubPage(location.pathname);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(getPath(['dashboard', 'profile']));
    }
  };

  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}` : '';

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background px-4">
      {shouldShowBack ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="border-b p-4">
              <div className="flex items-center gap-2">
                <img
                  src={resolvedTheme === 'dark' ? logoWhiteSrc : logoDarkSrc}
                  alt="OpenAthlete Logo"
                  className="h-10 w-10"
                />
                <SheetTitle>OpenAthlete</SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex flex-col gap-4 p-4">
              {/* Space Switcher */}
              <div className="border-b pb-4">
                <MobileSpaceSwitcher />
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 border-b pb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/avatars/shadcn.jpg" alt={fullName} />
                    <AvatarFallback>
                      {user.firstName[0]?.toUpperCase()}
                      {user.lastName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Settings */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate(getPath(['dashboard', 'settings']));
                }}
              >
                <CogIcon className="mr-2 h-4 w-4" />
                {m.settings()}
              </Button>

              {/* Language */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    {m.language()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {['en', 'fr'].map((lang) => (
                    <DropdownMenuItem
                      key={lang}
                      className={getLocale() === lang ? 'font-bold' : ''}
                      onClick={() => {
                        setLocale(lang as 'en' | 'fr');
                      }}
                    >
                      {getLocaleName(lang)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    {m.theme()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {['light', 'dark', 'system'].map((themeOption) => (
                    <DropdownMenuItem
                      key={themeOption}
                      className={theme === themeOption ? 'font-bold' : ''}
                      onClick={() => {
                        setTheme(themeOption);
                      }}
                    >
                      {themeOption === 'light'
                        ? m.theme_light()
                        : themeOption === 'dark'
                          ? m.theme_dark()
                          : m.theme_system()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {m.log_out()}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Title */}
      <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>

      {/* Actions Menu */}
      {actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">Page actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                className={
                  action.variant === 'destructive' ? 'text-destructive' : ''
                }
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
