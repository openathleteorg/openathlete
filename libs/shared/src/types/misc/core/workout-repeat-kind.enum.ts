/** How the athlete runs a repeat block */
export enum WORKOUT_REPEAT_KIND {
  /** Plain repetitions, or the sets of one exercise */
  REPEAT = 'REPEAT',
  /** Exercises in a row, then rest */
  SUPERSET = 'SUPERSET',
  CIRCUIT = 'CIRCUIT',
  /** Every minute (or `intervalSeconds`) on the minute */
  EMOM = 'EMOM',
  /** As many rounds as possible in `timeCapSeconds` */
  AMRAP = 'AMRAP',
  TABATA = 'TABATA',
}
