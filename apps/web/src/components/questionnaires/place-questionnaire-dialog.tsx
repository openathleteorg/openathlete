import { EventAPI, useCreateEventMutation } from '@/api/event';
import { eventKeys } from '@/api/event/event.keys';
import { useQuestionnairesQuery } from '@/api/questionnaire';
import {
  FormProvider,
  RHFDatePicker,
  RHFDateTimePicker,
  RHFSelect,
} from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SelectItem } from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { EVENT_TYPE, REPEAT_MAX_DAYS } from '@openathlete/shared';

import { endOfLocalDateInput } from '../calendar/utils/local-date';
import { countRepeatsEveryDays } from '../create-event-dialog/utils/repeat';

/** Days between two sends, by repeat option */
const REPEATS = {
  never: 0,
  daily: 1,
  weekly: 7,
  biweekly: 14,
} as const;
type Repeat = keyof typeof REPEATS;

const schema = z.object({
  questionnaireId: z.string().min(1, m.required()),
  startDate: z.date({ required_error: m.required() }),
  repeat: z.enum(['never', 'daily', 'weekly', 'biweekly']),
  repeatUntil: z.string().optional(),
});
type Values = z.infer<typeof schema>;

/** Questionnaires open in the morning, before the day's training */
const SEND_HOUR = 8;

const repeatLabel = (repeat: Repeat) =>
  ({
    never: m.repeat_never(),
    daily: m.repeat_every_day(),
    weekly: m.repeat_every_week(),
    biweekly: m.repeat_every_n_weeks({ count: 2 }),
  })[repeat];

interface P {
  open: boolean;
  onClose: () => void;
  /** The day clicked in the calendar */
  date?: Date;
  athleteId?: number;
}

/**
 * Places one of the coach's questionnaires in an athlete's calendar, once or
 * repeated. The athlete is told when it opens.
 */
export function PlaceQuestionnaireDialog({
  open,
  onClose,
  date,
  athleteId,
}: P) {
  const queryClient = useQueryClient();
  const { data: questionnaires, isLoading } = useQuestionnairesQuery({
    enabled: open,
  });
  const createEvent = useCreateEventMutation();

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { questionnaireId: '', repeat: 'never' },
  });
  const { reset, watch, setValue, getValues, handleSubmit, formState } =
    methods;

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    let start = date ? new Date(date) : new Date(now);
    start.setHours(SEND_HOUR, 0, 0, 0);
    // Sent today past the morning: it opens now rather than earlier on
    if (start < now && start.toDateString() === now.toDateString()) {
      start = new Date(now);
      start.setSeconds(0, 0);
    }
    reset({ questionnaireId: '', startDate: start, repeat: 'never' });
  }, [open, date, reset]);

  const startDate = watch('startDate');
  const repeat = watch('repeat');
  const until = watch('repeatUntil');
  const everyDays = REPEATS[repeat];

  // Turning the repetition on proposes four weeks
  useEffect(() => {
    if (everyDays > 0 && !getValues('repeatUntil') && startDate) {
      const day = addDays(startDate, 28);
      day.setHours(12, 0, 0, 0);
      setValue('repeatUntil', day.toISOString());
    }
  }, [everyDays, startDate, getValues, setValue]);

  const count =
    everyDays > 0 && until && startDate
      ? countRepeatsEveryDays(startDate, everyDays, endOfLocalDateInput(until))
      : 0;

  const onSubmit = handleSubmit(async (values) => {
    const questionnaire = questionnaires?.find(
      (item) => String(item.questionnaireId) === values.questionnaireId,
    );
    if (!questionnaire || !athleteId) return;
    try {
      const created = await createEvent.mutateAsync({
        type: EVENT_TYPE.QUESTIONNAIRE,
        questionnaireId: questionnaire.questionnaireId,
        name: questionnaire.title.slice(0, 100),
        athleteId,
        startDate: values.startDate,
        endDate: values.startDate,
      });
      if (everyDays > 0 && values.repeatUntil && created) {
        const until = endOfLocalDateInput(values.repeatUntil);
        await EventAPI.repeatEvent(
          created.eventId,
          everyDays < 7
            ? { everyDays, until }
            : { everyWeeks: everyDays / 7, until },
        );
        queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
      }
      toast.success(m.questionnaire_placed());
      onClose();
    } catch {
      toast.error(m.questionnaire_place_failed());
    }
  });

  const noQuestionnaire = !isLoading && (questionnaires?.length ?? 0) === 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.plan_a_questionnaire()}</DialogTitle>
          <DialogDescription>{m.questionnaire_place_hint()}</DialogDescription>
        </DialogHeader>
        {noQuestionnaire ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {m.questionnaire_none_yet()}
            </p>
            <Button asChild>
              <Link to={getPath(['dashboard', 'questionnaires', 'create'])}>
                <Plus className="size-4" />
                {m.questionnaire_create()}
              </Link>
            </Button>
          </div>
        ) : (
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="grid gap-4">
              <RHFSelect
                name="questionnaireId"
                label={m.questionnaire()}
                placeholder={m.questionnaire_choose()}
                required
              >
                {questionnaires?.map((questionnaire) => (
                  <SelectItem
                    key={questionnaire.questionnaireId}
                    value={String(questionnaire.questionnaireId)}
                  >
                    {questionnaire.title}
                  </SelectItem>
                ))}
              </RHFSelect>
              <RHFDateTimePicker
                name="startDate"
                label={m.questionnaire_opens_at()}
              />
              <RHFSelect name="repeat" label={m.repeat()}>
                {(Object.keys(REPEATS) as Repeat[]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {repeatLabel(option)}
                  </SelectItem>
                ))}
              </RHFSelect>
              {everyDays > 0 && (
                <>
                  <RHFDatePicker
                    name="repeatUntil"
                    label={m.repeat_until()}
                    min={startDate}
                    max={
                      startDate
                        ? addDays(startDate, REPEAT_MAX_DAYS)
                        : undefined
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {m.questionnaire_repeat_summary({ count: count + 1 })}
                  </p>
                </>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                {m.cancel()}
              </Button>
              <Button type="submit" disabled={formState.isSubmitting}>
                {m.questionnaire_send()}
              </Button>
            </DialogFooter>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
