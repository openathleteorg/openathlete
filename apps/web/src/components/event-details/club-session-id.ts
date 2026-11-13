import { Event } from '@openathlete/shared';

/** An event the club put in the calendar carries its session's id */
export const clubSessionIdOf = (event: Event | undefined) =>
  (event as (Event & { clubSessionId?: number | null }) | undefined)
    ?.clubSessionId ?? null;
