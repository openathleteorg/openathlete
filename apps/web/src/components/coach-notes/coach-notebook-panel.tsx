import {
  useCoachNotebookQuery,
  useSaveCoachNotebookMutation,
} from '@/api/coach-note';
import { ImageTextarea, RichText } from '@/components/images';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { Check, Lock, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { COACH_NOTEBOOK_MAX, STORED_FILE_PURPOSE } from '@openathlete/shared';

/** Typing pauses this long before the notebook saves */
const SAVE_DELAY_MS = 1000;

/**
 * A coach's general notebook: one free text for every athlete, written in
 * place and saved as they type. Read with its links and images; edited as
 * plain text.
 */
export function CoachNotebookPanel() {
  const { data: notebook, isPending } = useCoachNotebookQuery();
  const save = useSaveCoachNotebookMutation();
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;
  const savedRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (notebook) savedRef.current = notebook.content;
  }, [notebook]);

  const flush = (content: string) => {
    clearTimeout(timerRef.current);
    if (content === savedRef.current) return;
    savedRef.current = content;
    save.mutate(content, {
      onError: () => {
        // Retried with the next change, or on Done
        savedRef.current = '';
        toast.error(m.coach_note_save_failed());
      },
    });
  };

  const onChange = (content: string) => {
    setDraft(content);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flush(content), SAVE_DELAY_MS);
  };

  // Leaving the page saves what was typed last
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(
    () => () => {
      if (draftRef.current !== null) flush(draftRef.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const done = () => {
    if (draft !== null) flush(draft);
    setDraft(null);
  };

  if (isPending) return <Skeleton className="h-60 rounded-lg" />;

  const content = notebook?.content ?? '';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          {m.coach_notebook_hint()}
        </p>
        {editing ? (
          <Button onClick={done} size="sm">
            <Check className="size-4" />
            {m.coach_notebook_done()}
          </Button>
        ) : (
          <Button onClick={() => setDraft(content)} size="sm" variant="outline">
            <Pencil className="size-4" />
            {m.edit()}
          </Button>
        )}
      </div>

      {editing ? (
        <>
          <ImageTextarea
            value={draft}
            onChange={onChange}
            purpose={STORED_FILE_PURPOSE.COACH_NOTE}
            maxLength={COACH_NOTEBOOK_MAX}
            placeholder={m.coach_notebook_placeholder()}
            aria-label={m.coach_notebook()}
            className="min-h-[50vh]"
            autoFocus
          />
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {save.isPending
              ? m.coach_notebook_saving()
              : draft === savedRef.current
                ? m.coach_notebook_saved()
                : ''}
          </p>
        </>
      ) : content ? (
        <div className="rounded-lg border bg-card p-4">
          <RichText text={content} className="text-sm" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDraft('')}
          className="block w-full rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          {m.coach_notebook_empty()}
        </button>
      )}
    </div>
  );
}
