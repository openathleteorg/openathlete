import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { m } from '@/paraglide/messages';
import { useEffect, useMemo, useState } from 'react';

export type PickablePerson = { id: number; name: string; detail?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (ids: number[]) => void;
  title: string;
  description?: string;
  people: PickablePerson[];
  /** Ticked when the dialog opens */
  initialIds?: number[];
  submitLabel: string;
  emptyText: string;
  isLoading?: boolean;
  /** Submitting nothing is meaningful: clearing a list */
  allowEmpty?: boolean;
};

/** Several people at once, with a search for long club lists. */
export function PickPeopleDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  people,
  initialIds,
  submitLabel,
  emptyText,
  isLoading,
  allowEmpty = false,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(initialIds ?? []));
    setSearch('');
    // Reset when opening only: the parent rebuilds initialIds each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shown = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? people.filter((person) =>
          `${person.name} ${person.detail ?? ''}`
            .toLocaleLowerCase()
            .includes(query),
        )
      : people;
  }, [people, search]);

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {people.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <div className="flex min-h-0 flex-col gap-3">
            {people.length > 8 && (
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={m.club_search_people()}
                aria-label={m.club_search_people()}
              />
            )}
            <ul className="max-h-80 divide-y overflow-y-auto rounded-xl border">
              {shown.map((person) => (
                <li key={person.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2">
                    <Checkbox
                      checked={selected.has(person.id)}
                      onCheckedChange={() => toggle(person.id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {person.name}
                      </span>
                      {person.detail && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {person.detail}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {m.cancel()}
          </Button>
          <Button
            onClick={() => onSubmit([...selected])}
            isLoading={isLoading}
            disabled={isLoading || (!allowEmpty && selected.size === 0)}
          >
            {submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
