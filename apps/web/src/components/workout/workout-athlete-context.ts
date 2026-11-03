import { createContext, useContext } from 'react';

/**
 * The athlete a workout belongs to. Zone targets store ids of that athlete's
 * zones, so the builder offers them and badges resolve them, whoever is
 * signed in. Null (a template, the signed-in user's own session): the
 * signed-in user's zones.
 */
export const WorkoutAthleteContext = createContext<number | null>(null);

export const useWorkoutAthleteId = () => useContext(WorkoutAthleteContext);
