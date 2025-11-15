export function getStartDate(date?: Date): Date | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  d.setHours(8, 0, 0, 0);
  return d;
}

export function getEndDate(date?: Date): Date | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  d.setHours(9, 0, 0, 0);
  return d;
}

