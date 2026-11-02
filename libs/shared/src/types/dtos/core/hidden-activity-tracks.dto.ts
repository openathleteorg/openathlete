import { z } from 'zod';

import { SPORT_TYPE } from '../../misc';

/**
 * Tracks hidden from activity charts, per sport: what a cyclist wants to see
 * differs from a runner's. Storing what is hidden rather than shown lets new
 * tracks appear by default.
 */
export const hiddenActivityTracksSchema = z.record(
  z.nativeEnum(SPORT_TYPE),
  z.array(z.string().max(40)).max(40),
);

export type HiddenActivityTracks = z.infer<typeof hiddenActivityTracksSchema>;

/** The stored preference, whatever it holds */
export function readHiddenActivityTracks(value: unknown): HiddenActivityTracks {
  const parsed = hiddenActivityTracksSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}
