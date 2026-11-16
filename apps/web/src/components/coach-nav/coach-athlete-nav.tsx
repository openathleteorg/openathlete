import { useGroupFilterOptions } from '@/components/clubs/use-group-filter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { m } from '@/paraglide/messages';
import { User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { athletePagePath, athleteRoute } from './athlete-route';

/** Past this, a search helps more than it costs room */
const SEARCH_FROM = 7;

type Athlete = { athleteId: number; name: string };

/**
 * The coach's athletes, one line each: a search and a group filter keep
 * thirty of them usable. An athlete opens on their calendar; their other
 * pages are tabs there.
 */
export function CoachAthleteNav({ athletes }: { athletes: Athlete[] }) {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const groups = useGroupFilterOptions();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const current = athleteRoute(pathname)?.athleteId;

  const shown = useMemo(() => {
    const selected = groups.find((option) => option.value === group);
    const query = search.trim().toLocaleLowerCase();
    return athletes
      .filter(
        (athlete) => !selected || selected.athleteIds.has(athlete.athleteId),
      )
      .filter(
        (athlete) => !query || athlete.name.toLocaleLowerCase().includes(query),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [athletes, groups, group, search]);

  if (athletes.length === 0) return null;

  return (
    <SidebarGroup data-coach-athlete-nav>
      <SidebarGroupLabel>
        {m.coach_nav_athletes({ count: athletes.length })}
      </SidebarGroupLabel>
      <div className="space-y-2 px-2 pb-2">
        {athletes.length >= SEARCH_FROM && (
          <SidebarInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={m.coach_nav_search()}
            aria-label={m.coach_nav_search()}
          />
        )}
        {groups.length > 0 && (
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger
              size="sm"
              className="w-full"
              aria-label={m.groups_filter_label()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{m.groups_filter_all()}</SelectItem>
              {groups.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <SidebarMenu>
        {shown.map((athlete) => (
          <SidebarMenuItem key={athlete.athleteId}>
            <SidebarMenuButton
              asChild
              isActive={current === athlete.athleteId}
              className={isMobile ? 'min-h-11 text-base' : undefined}
            >
              <Link
                to={athletePagePath('calendar', athlete.athleteId)}
                onClick={() => isMobile && setOpenMobile(false)}
              >
                <User />
                <span className="truncate">{athlete.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {shown.length === 0 && (
          <p className="px-2 py-1 text-xs text-muted-foreground">
            {m.coach_nav_none()}
          </p>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
