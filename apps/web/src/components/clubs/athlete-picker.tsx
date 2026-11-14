import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { m } from '@/paraglide/messages';
import { useMemo, useState } from 'react';

import { PickedAthlete } from './use-coached-athletes';
import { useGroupFilterOptions } from './use-group-filter';

type Props = {
  athletes: PickedAthlete[];
  /** Athlete ids */
  selected: Set<number>;
  onChange: (selected: Set<number>) => void;
};

/**
 * Picks athletes the coach coaches: a whole group at once (their own
 * groups, their clubs'), then one by one, with a search for long lists.
 */
export function AthletePicker({ athletes, selected, onChange }: Props) {
  const groups = useGroupFilterOptions();
  // One row per club: its name once, then its groups by their own names
  const sources = useMemo(() => {
    const bySource = new Map<string | null, typeof groups>();
    for (const group of groups) {
      bySource.set(group.club, [...(bySource.get(group.club) ?? []), group]);
    }
    return [...bySource.entries()];
  }, [groups]);
  const [search, setSearch] = useState('');
  const eligible = useMemo(
    () => new Set(athletes.map((athlete) => athlete.athleteId)),
    [athletes],
  );
  const shown = search.trim()
    ? athletes.filter((athlete) =>
        athlete.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      )
    : athletes;

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  const addGroup = (ids: Set<number>) => {
    const next = new Set(selected);
    for (const id of ids) if (eligible.has(id)) next.add(id);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {groups.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{m.plan_for_athletes_groups()}</p>
          {sources.map(([club, clubGroups]) => (
            <div key={club ?? ''} className="space-y-1.5">
              {club && sources.length > 1 && (
                <p className="text-xs text-muted-foreground">{club}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {clubGroups.map((group) => (
                  <Button
                    key={group.value}
                    variant="outline"
                    size="sm"
                    className="max-md:h-11"
                    // The club stays in the name screen readers announce
                    aria-label={`+ ${group.label}`}
                    title={group.label}
                    onClick={() => addGroup(group.athleteIds)}
                  >
                    + {group.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">
            {m.plan_for_athletes_athletes({ count: selected.size })}
          </p>
          {selected.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="max-md:h-11"
              onClick={() => onChange(new Set())}
            >
              {m.plan_for_athletes_clear()}
            </Button>
          )}
        </div>
        {athletes.length > 8 && (
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={m.club_search_people()}
            aria-label={m.club_search_people()}
          />
        )}
        {athletes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {m.plan_for_athletes_no_athletes()}
          </p>
        ) : (
          // shrink-0: in a phone's sheet the list would shrink to nothing,
          // the sheet scrolls instead
          <ul className="max-h-64 shrink-0 divide-y overflow-y-auto rounded-xl border">
            {shown.map((athlete) => (
              <li key={athlete.athleteId}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                  <Checkbox
                    checked={selected.has(athlete.athleteId)}
                    onCheckedChange={() => toggle(athlete.athleteId)}
                  />
                  <span className="truncate">{athlete.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
