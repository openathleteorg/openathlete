import type { NavMain } from '@/components/sidebar/nav-main';
import {
  DropdownMenu,
  DropdownMenuContent,
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
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { m } from '@/paraglide/messages';
import { User, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Athlete navigation for the collapsed desktop sidebar. In icon mode the
 * sidebar hides submenus, so each athlete's pages are listed in a menu that
 * opens beside a single Athletes button.
 */
export function CollapsedAthleteMenu({
  athletes,
}: {
  athletes: Parameters<typeof NavMain>[0]['items'];
}) {
  const { pathname } = useLocation();
  const isSelected = (athlete: (typeof athletes)[number]) =>
    athlete.items?.some((item) => item.url === pathname);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip={m.athletes()}
                aria-label={m.athletes()}
                isActive={athletes.some(isSelected)}
                disabled={athletes.length === 0}
              >
                <Users />
                <span>{m.athletes()}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-64"
            >
              <DropdownMenuLabel>{m.athletes()}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {athletes.map((athlete) => (
                <DropdownMenuSub key={athlete.items?.[0]?.url ?? athlete.title}>
                  <DropdownMenuSubTrigger
                    className={`gap-2 min-h-11 ${isSelected(athlete) ? 'bg-accent font-semibold' : ''}`}
                  >
                    <User className="size-4 shrink-0" />
                    <span className="min-w-0 break-words">{athlete.title}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="min-w-48 max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto">
                      <DropdownMenuLabel className="max-w-64 break-words">
                        {athlete.title}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {athlete.items?.map((item) => (
                        <DropdownMenuItem key={item.url} asChild>
                          <Link
                            to={item.url}
                            aria-current={
                              pathname === item.url ? 'page' : undefined
                            }
                            className={`min-h-11 ${pathname === item.url ? 'font-semibold bg-accent' : ''}`}
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
