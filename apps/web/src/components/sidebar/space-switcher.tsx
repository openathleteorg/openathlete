import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useUserRoles } from '@/contexts/auth';
import { useSpaceContext } from '@/contexts/space';
import { m } from '@/paraglide/messages';
import { ChevronsUpDown, Medal, Users } from 'lucide-react';
import * as React from 'react';

import { UserRole } from '@openathlete/shared';

export function SpaceSwitcher() {
  const roles = useUserRoles();
  const { isMobile } = useSidebar();
  const { space, setSpace } = useSpaceContext();
  const { data: coachedAthletes } = useGetMyCoachedAthletesQuery();

  const isMac = React.useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      navigator.platform.toUpperCase().indexOf('MAC') >= 0,
    [],
  );

  const spaces = React.useMemo<
    { role: UserRole; name: string; logo: React.ElementType }[]
  >(
    () =>
      roles?.map((role) => {
        switch (role) {
          case 'ATHLETE':
            return {
              role: 'ATHLETE',
              name: m.athlete(),
              logo: Medal,
            };
          case 'COACH':
            return {
              role: 'COACH',
              name: m.coach(),
              logo: Users,
            };
        }
      }) || [],
    [roles],
  );

  const activeSpace = spaces.find((s) => s.role === space);

  const hasNoAthletes = !coachedAthletes || coachedAthletes.length === 0;

  React.useEffect(() => {
    if (activeSpace?.role === 'COACH' && hasNoAthletes) {
      setSpace('ATHLETE');
    }

    if (!activeSpace || spaces.length <= 1 || hasNoAthletes) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed =
        (event.metaKey || event.ctrlKey) && event.shiftKey;
      if (!isModifierPressed) return;
      const key = event.key;
      const numberMatch = key.match(/^[1-9]$/);

      if (numberMatch) {
        const index = parseInt(numberMatch[0], 10) - 1;
        if (index < spaces.length) {
          event.preventDefault();
          event.stopPropagation();
          setSpace(spaces[index].role);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [spaces, setSpace, activeSpace, hasNoAthletes]);
  if (!activeSpace || spaces.length <= 1 || hasNoAthletes) {
    return null;
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeSpace.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeSpace.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {m.spaces()}
            </DropdownMenuLabel>
            {spaces.map((space, index) => (
              <DropdownMenuItem
                key={space.name}
                onClick={() => setSpace(space.role)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  <space.logo className="size-4 shrink-0" />
                </div>
                {space.name}
                <DropdownMenuShortcut>
                  {isMac ? '⌘⇧' : 'Ctrl+Shift+'}
                  {index + 1}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
