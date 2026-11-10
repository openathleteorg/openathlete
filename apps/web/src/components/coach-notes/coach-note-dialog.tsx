import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import {
  useCreateCoachNoteMutation,
  useUpdateCoachNoteMutation,
} from '@/api/coach-note';
import { FormProvider } from '@/components/hook-form';
import { RHFCheckbox } from '@/components/hook-form/rhf-checkbox';
import { RHFSelect } from '@/components/hook-form/rhf-select';
import { RHFTextField } from '@/components/hook-form/rhf-text-field';
import { RHFTextarea } from '@/components/hook-form/rhf-textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SelectItem } from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  COACH_NOTE_CONTENT_MAX,
  COACH_NOTE_TITLE_MAX,
  type CoachNote,
} from '@openathlete/shared';

const GENERAL = 'general';

const formSchema = z.object({
  title: z.string().trim().min(1, m.required()).max(COACH_NOTE_TITLE_MAX),
  content: z.string().max(COACH_NOTE_CONTENT_MAX),
  // The select holds strings: an athlete id, or GENERAL
  athlete: z.string(),
  pinned: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface P {
  open: boolean;
  onClose: () => void;
  /** The note to edit; none to write a new one */
  note?: CoachNote | null;
  /** The athlete a new note is about by default */
  athleteId?: number;
}

export function CoachNoteDialog({ open, onClose, note, athleteId }: P) {
  const { data: athletes = [] } = useGetMyCoachedAthletesQuery();
  const createNote = useCreateCoachNoteMutation();
  const updateNote = useUpdateCoachNoteMutation();
  const isPending = createNote.isPending || updateNote.isPending;

  const methods = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (!open) return;
    const noteAthlete = note ? note.athleteId : athleteId;
    methods.reset({
      title: note?.title ?? '',
      content: note?.content ?? '',
      athlete: noteAthlete ? String(noteAthlete) : GENERAL,
      pinned: note?.pinned ?? false,
    });
  }, [open, note, athleteId, methods]);

  const onSubmit = methods.handleSubmit(async (values) => {
    const body = {
      title: values.title,
      content: values.content,
      pinned: values.pinned,
      athleteId:
        values.athlete === GENERAL ? null : Number.parseInt(values.athlete, 10),
    };
    try {
      if (note) {
        await updateNote.mutateAsync({ id: note.coachNoteId, body });
      } else {
        await createNote.mutateAsync(body);
      }
      toast.success(m.coach_note_saved());
      onClose();
    } catch {
      toast.error(m.coach_note_save_failed());
    }
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent mobileFullscreen className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {note ? m.coach_note_edit() : m.coach_notes_new()}
          </DialogTitle>
          <DialogDescription>{m.coach_notes_private_hint()}</DialogDescription>
        </DialogHeader>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4">
            <RHFTextField
              name="title"
              label={m.coach_note_title()}
              maxLength={COACH_NOTE_TITLE_MAX}
              required
              autoFocus
            />
            <RHFTextarea
              name="content"
              label={m.coach_note_content()}
              placeholder={m.coach_note_content_placeholder()}
              className="min-h-[200px]"
            />
            <RHFSelect name="athlete" label={m.coach_note_athlete()}>
              <SelectItem value={GENERAL}>{m.coach_note_general()}</SelectItem>
              {athletes.map((athlete) => (
                <SelectItem
                  key={athlete.athleteId}
                  value={String(athlete.athleteId)}
                >
                  {`${athlete.user?.firstName ?? ''} ${athlete.user?.lastName ?? ''}`.trim()}
                </SelectItem>
              ))}
            </RHFSelect>
            <RHFCheckbox name="pinned" label={m.coach_note_pin()} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {m.cancel()}
              </Button>
              <Button type="submit" isLoading={isPending}>
                {m.save()}
              </Button>
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
