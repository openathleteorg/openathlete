/**
 * How a coach's words become step durations and the session's duration,
 * shared by the agents that write workouts. Pool lengths read as repetitions
 * made a 45' swim show as 24'.
 */
export const WORKOUT_DURATIONS_INSTRUCTIONS = `DURATIONS:
- TIME: Duration in seconds (e.g., 600 = 10 minutes)
- DISTANCE: Distance in meters (e.g., 5000 = 5km)
- OPEN: No fixed duration
- REPS: ONLY for strength or gym exercises (squats, push-ups...). NEVER for running, cycling, swimming or any endurance step: an endurance step is TIME or DISTANCE

SWIMMING (pool):
- Pool lengths are DISTANCE steps in meters: "vasca/vasche" (it), "longueur(s)" (fr), "length(s)"/"lap(s)" (en), "largo/largos" (es), "piscina(s)" (pt): number of lengths × pool length
- The pool is 25 m unless the text states another length (e.g., "vasca da 50", "bassin de 50 m", "long course" = 50 m)
- Example: "8 vasche @z2" = { "stepType": "INTERVAL_ACTIVE", "durationType": "DISTANCE", "durationValue": 200 } with the Z2 zone target
- "8 vasche + 1 vasca @z3 + 1 vasca @z4" inside a repeat = three DISTANCE child steps: 200, 25 and 25
- Swim PACE targets stay in min/km: 1:45 /100 m = 17.5

REST:
- Rest on the spot ("fermo", "rest", "récup sur place", "repos", "recuperación", "descanso", "pausa") is an INTERVAL_REST step with durationType TIME (e.g., "1' fermo" = 60 seconds), without a target

SESSION DURATION (goalDuration):
- goalDuration is the planned duration of the whole session, in SECONDS (45 minutes = 2700)
- When the text states a total ("in totale 45'", "45 min au total", "1h in all"), goalDuration MUST equal that total, even if the steps add up to less (their duration is an estimate)
- Otherwise set goalDuration to the total of the steps, estimating DISTANCE steps at the athlete's pace for the sport
- Notation: 15' = 15 minutes, 30" = 30 seconds`;
