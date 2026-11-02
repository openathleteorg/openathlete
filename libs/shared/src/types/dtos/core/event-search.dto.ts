import z from 'zod';

import { SPORT_TYPE } from '../../misc';

export const eventSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});
export type EventSearchQuery = z.infer<typeof eventSearchQuerySchema>;

export interface EventSearchResult {
  eventId: number;
  name: string;
  startDate: Date;
  sport: SPORT_TYPE;
  athleteId: number;
  athleteName: string;
}
