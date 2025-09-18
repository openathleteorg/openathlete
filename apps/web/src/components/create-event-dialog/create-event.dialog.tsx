import { m } from '@/paraglide/messages';
import {
  useCreateEventMutation,
  useUpdateEventMutation,
} from '@/services/event';
import { eventTypeLabelMap, sportTypeLabelMap } from '@/utils/label-map/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  EVENT_TYPE,
  Event,
  SPORT_TYPE,
  createEventDtoSchema,
  formatSpeed,
} from '@openathlete/shared';

import { useCalendarContext } from '../calendar/hooks/use-calendar-context';
import {
  FormProvider,
  RHFDistance,
  RHFDuration,
  RHFSelect,
  RHFTextField,
} from '../hook-form';
import { RHFElevation } from '../hook-form/rhf-elevation';
import { RHFRpe } from '../hook-form/rhf-rpe';
import { RHFTextarea } from '../hook-form/rhf-textarea';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { SelectItem } from '../ui/select';

type P =
  | {
      open: boolean;
      onClose: () => void;
      date?: Date;
      type?: EVENT_TYPE;
    }
  | {
      open: boolean;
      onClose: () => void;
      event?: Event;
    };

export function CreateEventDialog({ open, onClose, ...rest }: P) {
  const { athleteId } = useCalendarContext();
  const edit = 'event' in rest;
  const create = 'type' in rest && 'date' in rest;
  const startDate = useMemo(() => {
    if (create) {
      if (!rest.date) return undefined;
      const d = new Date(rest.date);
      d.setHours(8);
      d.setMinutes(0);
      d.setSeconds(0);
      return d;
    } else if (edit) {
      return rest.event?.startDate;
    }
  }, [rest]);
  const endDate = useMemo(() => {
    if (create) {
      if (!rest.date) return undefined;
      const d = new Date(rest.date);
      d.setHours(9);
      d.setMinutes(0);
      d.setSeconds(0);
      return d;
    } else if (edit) {
      return rest.event?.endDate;
    }
  }, [rest]);

  const createEventMutation = useCreateEventMutation({
    onSuccess: () => {
      onClose();
      toast.success(m.event_created_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_create_event());
    },
  });
  const updateEventMutation = useUpdateEventMutation({
    onSuccess: () => {
      onClose();
      toast.success(m.event_updated_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_update_event());
    },
  });

  const methods = useForm<z.infer<typeof createEventDtoSchema>>({
    resolver: zodResolver(createEventDtoSchema, undefined),
    defaultValues: edit
      ? rest.event
      : create
        ? {
            type: rest.type,
            name: '',
            description: '',
            startDate,
            endDate,
          }
        : {},
  });

  const { handleSubmit, setValue, watch } = methods;

  const onSubmit = handleSubmit(async (data) => {
    if (create) createEventMutation.mutate({ ...data, athleteId });
    if (edit && rest.event)
      updateEventMutation.mutate({ eventId: rest.event.eventId, body: data });
  });

  const startDateValue = watch('startDate');
  const goalDistanceValue = watch('goalDistance');
  const goalDurationValue = watch('goalDuration');

  if ((create && (!rest.date || !rest.type)) || (edit && !rest.event)) {
    return null;
  }
  const type = create
    ? rest.type || EVENT_TYPE.TRAINING
    : edit
      ? rest.event?.type || EVENT_TYPE.TRAINING
      : EVENT_TYPE.TRAINING;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {edit ? m.edit() : m.plan()} {m.a()} {eventTypeLabelMap[type]}
          </DialogTitle>
        </DialogHeader>
        <FormProvider
          methods={methods}
          onSubmit={onSubmit}
          className="grid grid-cols-2 gap-6 pt-3"
        >
          <RHFTextField
            name="name"
            type="text"
            placeholder={m.morning_run()}
            label={m.event_name()}
            required
          />
          {type === EVENT_TYPE.TRAINING ||
          type === EVENT_TYPE.COMPETITION ||
          type === EVENT_TYPE.ACTIVITY ? (
            <RHFSelect
              name="sport"
              label={m.sport()}
              required
              placeholder={m.select_a_sport()}
            >
              {Object.values(SPORT_TYPE).map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sportTypeLabelMap[sport]}
                </SelectItem>
              ))}
            </RHFSelect>
          ) : (
            <div />
          )}
          {/* {type !== EVENT_TYPE.ACTIVITY && (
            <>
              <RHFTimePicker
                name="startDate"
                label={m.start_time()}
                required
                onChange={(value) => {
                  if (!value) return;
                  const start = new Date(value);
                  const end = new Date(start);
                  if (goalDurationValue) {
                    end.setSeconds(start.getSeconds() + goalDurationValue);
                  } else {
                    end.setHours(start.getHours() + 1);
                  }
                  setValue('endDate', end);
                }}
              />
              <RHFTimePicker
                name="endDate"
                label={m.end_time()}
                required
                onChange={(value) => {
                  if (!value) return;
                  const end = new Date(value);
                  const start = new Date(startDateValue);

                  const duration = end.getTime() - start.getTime();
                  const durationInSeconds = Math.floor(duration / 1000);
                  setValue('goalDuration', durationInSeconds);
                }}
              />
            </>
          )} */}
          <div className="col-span-2">
            <RHFTextarea
              name="description"
              label={m.description()}
              className="h-24"
              required={type === EVENT_TYPE.NOTE}
            />
          </div>
          {(type === EVENT_TYPE.TRAINING ||
            type === EVENT_TYPE.COMPETITION) && (
            <>
              <RHFDistance name="goalDistance" label={m.goal_distance()} />
              <RHFDuration
                name="goalDuration"
                label={m.goal_duration()}
                onChange={(value) => {
                  const start = new Date(startDateValue);
                  const duration = value || 0;
                  const end = new Date(start);
                  end.setSeconds(start.getSeconds() + duration);
                  setValue('endDate', end);
                }}
              />
              {!!goalDistanceValue && !!goalDurationValue && (
                <div className="text-sm text-gray-500 flex items-center col-span-2">
                  {m.pace()}:{' '}
                  {formatSpeed(goalDistanceValue / goalDurationValue, 'min/km')}{' '}
                  {m.per_km()} -{' '}
                  {formatSpeed(goalDistanceValue / goalDurationValue, 'km/h')}{' '}
                  {m.kilometers_per_hour()}
                </div>
              )}
              <RHFElevation
                name="goalElevationGain"
                label={m.goal_elevation_gain()}
              />
              <RHFRpe name="goalRpe" label={m.goal_rpe()} />
            </>
          )}
          {type === EVENT_TYPE.ACTIVITY && (
            <div className="col-span-2">
              <RHFRpe name="rpe" label={m.rpe()} />
            </div>
          )}

          <Button
            type="submit"
            className="w-full col-span-2"
            onClick={onSubmit}
            isLoading={createEventMutation.isPending}
          >
            {edit ? m.edit() : m.create()} {m.the()}
            {eventTypeLabelMap[type]}
          </Button>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
