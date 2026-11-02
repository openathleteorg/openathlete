import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import { useSearchActivitiesQuery } from '@/api/event';
import { useSpaceContext } from '@/contexts/space';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { activityPath, getPath } from '@/routes/paths';
import { matchesQuery } from '@/utils/finder';
import { getDateLocale } from '@/utils/locales';
import {
  Activity,
  Calendar,
  CogIcon,
  LucideIcon,
  MedalIcon,
  MessageCircle,
  PieChart,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SportIcon } from '../sport-icon/sport-icon';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';

const DEBOUNCE_MS = 200;
const MIN_SEARCH_LENGTH = 2;

interface Link {
  label: string;
  url: string;
  icon: LucideIcon;
}

const ATHLETE_SECTIONS = [
  { path: 'calendar', label: m.calendar, icon: Calendar },
  { path: 'statistics', label: m.statistics, icon: PieChart },
  { path: 'records', label: m.records, icon: MedalIcon },
  { path: 'metrics', label: m.metrics, icon: Activity },
] as const;

interface P {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinderDialog({ open, onOpenChange }: P) {
  const navigate = useNavigate();
  const { space } = useSpaceContext();
  const { data: athletes = [] } = useGetMyCoachedAthletesQuery();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: found = [] } = useSearchActivitiesQuery(
    search,
    open && search.length >= MIN_SEARCH_LENGTH,
  );

  // The previous results stay on screen while typing, not once the text is gone
  const activities = query.trim().length >= MIN_SEARCH_LENGTH ? found : [];

  const pages = useMemo<Link[]>(() => {
    const shared: Link[] = [
      {
        label: m.messages(),
        url: getPath(['dashboard', 'messages']),
        icon: MessageCircle,
      },
      {
        label: m.settings(),
        url: getPath(['dashboard', 'settings']),
        icon: CogIcon,
      },
    ];
    if (space === 'COACH')
      return [
        {
          label: m.dashboard(),
          url: getPath(['dashboard', 'coach']),
          icon: PieChart,
        },
        ...shared,
      ];
    return [
      ...ATHLETE_SECTIONS.map(({ path, label, icon }) => ({
        label: label(),
        url: getPath(['dashboard', path]),
        icon,
      })),
      ...shared,
    ];
  }, [space]);

  const athleteLinks = useMemo<Link[]>(() => {
    const matching = athletes
      .map((athlete) => ({
        athleteId: athlete.athleteId,
        name: `${athlete.user?.firstName} ${athlete.user?.lastName}`,
      }))
      .filter(({ name }) => matchesQuery(name, query));
    return matching.flatMap(({ athleteId, name }) => {
      const open: Link = {
        label: name,
        url: `${getPath(['dashboard', 'calendar'])}/${athleteId}`,
        icon: User,
      };
      // Their other pages are one word away once the athlete is found
      if (!query.trim()) return [open];
      return [
        open,
        ...ATHLETE_SECTIONS.slice(1).map(({ path, label, icon }) => ({
          label: `${name} · ${label()}`,
          url: `${getPath(['dashboard', path])}/${athleteId}`,
          icon,
        })),
      ];
    });
  }, [athletes, query]);

  const shownPages = pages.filter(({ label }) => matchesQuery(label, query));

  const go = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  const renderLinks = (links: Link[]) =>
    links.map(({ label, url, icon: Icon }) => (
      <CommandItem key={url} value={url} onSelect={() => go(url)}>
        <Icon />
        <span className="truncate">{label}</span>
      </CommandItem>
    ));

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={m.finder_open()}
      description={m.finder_placeholder()}
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={m.finder_placeholder()}
      />
      <CommandList>
        <CommandEmpty>{m.finder_empty()}</CommandEmpty>
        {athleteLinks.length > 0 && (
          <CommandGroup heading={m.athletes()}>
            {renderLinks(athleteLinks)}
          </CommandGroup>
        )}
        {activities.length > 0 && (
          <CommandGroup heading={m.finder_activities()}>
            {activities.map((activity) => (
              <CommandItem
                key={activity.eventId}
                value={`activity-${activity.eventId}`}
                onSelect={() => go(activityPath(activity.eventId))}
              >
                <SportIcon sport={activity.sport} className="size-4" />
                <span className="truncate">{activity.name}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {athletes.length > 0 && `${activity.athleteName} · `}
                  {new Date(activity.startDate).toLocaleDateString(
                    getDateLocale(getLocale()),
                    { day: 'numeric', month: 'short', year: 'numeric' },
                  )}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {shownPages.length > 0 && (
          <CommandGroup heading={m.finder_pages()}>
            {renderLinks(shownPages)}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
