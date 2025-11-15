import { z } from 'zod';

import { createEventDtoSchema } from '../core/create-event.dto';
import { updateEventDtoSchema } from '../core/update-event.dto';

export const modifyEventDtoSchema = z.object({
  prompt: z.string().min(1).max(500),
  eventData: createEventDtoSchema,
});

export type ModifyEventDto = z.infer<typeof modifyEventDtoSchema>;

export const modifyEventResponseDtoSchema = updateEventDtoSchema;

export type ModifyEventResponseDto = z.infer<
  typeof modifyEventResponseDtoSchema
>;
