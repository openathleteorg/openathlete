import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import {
  useCoachNotesQuery,
  useDeleteCoachNoteMutation,
  useUpdateCoachNoteMutation,
} from '@/api/coach-note';
import { ConfirmAction } from '@/components/confirm-action/confirm-action';
import { RichText } from '@/components/images';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  Lock,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { CoachNote } from '@openathlete/shared';

import { CoachNoteDialog } from './coach-note-dialog';

interface P {
  /** One athlete's notes; none: every note, general ones included */
  athleteId?: number;
  className?: string;
}

/**
 * A coach's private notebook: observations, reminders and reference links
 * about an athlete or general. Never shown to athletes.
 */
export function CoachNotesPanel({ athleteId, className }: P) {
  const { data: notes = [], isPending } = useCoachNotesQuery(athleteId);
  const { data: athletes = [] } = useGetMyCoachedAthletesQuery();
  const updateNote = useUpdateCoachNoteMutation();
  const deleteNote = useDeleteCoachNoteMutation();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CoachNote | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CoachNote | null>(null);

  const athleteNames = useMemo(
    () =>
      new Map(
        athletes.map((athlete) => [
          athlete.athleteId,
          `${athlete.user?.firstName ?? ''} ${athlete.user?.lastName ?? ''}`.trim(),
        ]),
      ),
    [athletes],
  );

  const shown = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return notes;
    return notes.filter((note) =>
      [
        note.title,
        note.content,
        note.athleteId ? athleteNames.get(note.athleteId) : '',
      ].some((text) => text?.toLocaleLowerCase().includes(query)),
    );
  }, [notes, search, athleteNames]);

  const togglePinned = (note: CoachNote) =>
    updateNote.mutate(
      { id: note.coachNoteId, body: { pinned: !note.pinned } },
      { onError: () => toast.error(m.coach_note_save_failed()) },
    );

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteNote.mutateAsync(deleting.coachNoteId);
      toast.success(m.coach_note_deleted());
    } catch {
      toast.error(m.coach_note_save_failed());
    }
    setDeleting(null);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(getDateLocale(getLocale()), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className={cn('space-y-4', className)}>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="size-4 shrink-0" />
        {m.coach_notes_private_hint()}
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={m.coach_notes_search()}
            aria-label={m.coach_notes_search()}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setCreating(true)}
          aria-label={m.coach_notes_new()}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">{m.coach_notes_new()}</span>
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {notes.length === 0
            ? m.coach_notes_empty()
            : m.coach_notes_no_match()}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((note) => (
            <li
              key={note.coachNoteId}
              className="space-y-2 rounded-lg border bg-card p-4"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="flex items-center gap-1.5 font-medium break-words">
                    {note.pinned && (
                      <Pin
                        className="size-3.5 shrink-0 text-primary"
                        aria-label={m.coach_note_pinned()}
                      />
                    )}
                    {note.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {athleteId === undefined && (
                      <Badge variant="secondary">
                        {note.athleteId
                          ? (athleteNames.get(note.athleteId) ??
                            m.coach_note_general())
                          : m.coach_note_general()}
                      </Badge>
                    )}
                    <span>
                      {m.coach_note_updated_on({
                        date: formatDate(note.updatedAt),
                      })}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0 md:size-9"
                      aria-label={m.ui_more()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(note)}>
                      <Pencil className="size-4" />
                      {m.edit()}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePinned(note)}>
                      {note.pinned ? (
                        <PinOff className="size-4" />
                      ) : (
                        <Pin className="size-4" />
                      )}
                      {note.pinned ? m.coach_note_unpin() : m.coach_note_pin()}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleting(note)}
                    >
                      <Trash2 className="size-4" />
                      {m.delete_()}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {note.content && (
                <RichText
                  text={note.content}
                  className="text-sm text-muted-foreground"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <CoachNoteDialog
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        note={editing}
        athleteId={athleteId}
      />
      <ConfirmAction
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title={m.coach_note_delete_title()}
        message={m.coach_note_delete_message()}
        confirmText={m.delete_()}
        isLoading={deleteNote.isPending}
      />
    </div>
  );
}
