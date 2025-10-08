'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getLocale, setLocale } from '@/paraglide/runtime';
import { getPath } from '@/routes/paths';
import { getLocaleName } from '@/utils/locales';
import { ChevronsUpDown, CogIcon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';

export function NavUser() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`;
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="/avatars/shadcn.jpg" alt={fullName} />
                <AvatarFallback className="rounded-lg">
                  {user.firstName[0].toUpperCase()}
                  {user.lastName[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{fullName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/avatars/shadcn.jpg" alt={fullName} />
                  <AvatarFallback className="rounded-lg">
                    {user.firstName[0].toUpperCase()}
                    {user.lastName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{fullName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => navigate(getPath(['dashboard', 'settings']))}
              >
                <CogIcon />
                {m.settings()}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>{m.language()}</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
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
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>{m.theme()}</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
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
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut />
              {m.log_out()}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
