import { z } from 'zod';

/**
 * Athletes, among the user's own profile and the ones they coach, holding
 * activities or metrics imported from Garmin: the app shows Garmin's
 * attribution next to their data and anything derived from it.
 */
export const garminDataAthletesSchema = z.object({
  athleteIds: z.array(z.number().int()),
});
export type GarminDataAthletes = z.infer<typeof garminDataAthletesSchema>;
