/** Which columns a set row shows */
export interface SetColumns {
  load: boolean;
  rpe: boolean;
  rest: boolean;
}

/** The grid of a set row, between a leading and a trailing column */
export const gridColumns = (columns: SetColumns, lead: string, trail: string) =>
  [
    lead,
    '1fr',
    columns.load && '1fr',
    columns.rpe && '0.7fr',
    columns.rest && '1fr',
    trail,
  ]
    .filter(Boolean)
    .join(' ');
