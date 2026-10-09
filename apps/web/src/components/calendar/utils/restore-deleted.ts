import { EventAPI } from '@/api/event/event.api';
import { eventKeys } from '@/api/event/event.keys';
import { invalidateTrainingLoadQueries } from '@/api/training-load/training-load.keys';
import { QueryClient } from '@tanstack/react-query';

import { Event } from '@openathlete/shared';

import { toRecreateDto } from './recreate';

/**
 * Re-creates deleted planned events, one at a time like their deletion, to
 * undo it. Throws if any could not be re-created.
 */
export async function restoreDeleted(
  queryClient: QueryClient,
  events: Event[],
) {
  let failed = 0;
  for (const event of events) {
    const dto = toRecreateDto(event);
    if (!dto) continue;
    try {
      await EventAPI.createEvent(dto);
    } catch {
      failed++;
    }
  }
  await queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
  invalidateTrainingLoadQueries(queryClient);
  if (failed) throw new Error(`${failed} events could not be restored`);
}
