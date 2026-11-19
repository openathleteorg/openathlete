import { z } from 'zod';

/** How distances, weights and speeds are shown to a user */
export const unitSystemSchema = z.enum(['METRIC', 'IMPERIAL']);

export type UnitSystem = z.infer<typeof unitSystemSchema>;
