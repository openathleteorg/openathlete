import { z } from 'zod';

import { createEventDtoSchema } from '../core/create-event.dto';
import { updateEventDtoSchema } from '../core/update-event.dto';

export const modifyEventDtoSchema = z
  .object({
    prompt: z.string().min(1).max(500),
    eventId: z.number().int().positive().optional(),
    eventData: createEventDtoSchema.optional(),
  })
  .refine(
    (data) => data.eventId !== undefined || data.eventData !== undefined,
    {
      message: 'Either eventId or eventData must be provided',
    },
  );

export type ModifyEventDto = z.infer<typeof modifyEventDtoSchema>;

export const modifyEventResponseDtoSchema = updateEventDtoSchema;

export type ModifyEventResponseDto = z.infer<
  typeof modifyEventResponseDtoSchema
>;
