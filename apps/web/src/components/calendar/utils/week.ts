const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getWeekStart(date: Date): Date {
  const source = new Date(date);
  const result = new Date(
    Date.UTC(source.getFullYear(), source.getMonth(), source.getDate()),
  );
  const day = (result.getUTCDay() + 6) % 7;
  result.setUTCDate(result.getUTCDate() - day);
  return result;
}

export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  return end;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * ONE_DAY_IN_MS);
}

export function getWeekKey(date: Date): string {
  return getWeekStart(date).toISOString();
}
