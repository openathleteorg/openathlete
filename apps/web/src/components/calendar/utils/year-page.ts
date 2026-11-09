export const YEARS_PER_PAGE = 12;

/** The first year of the page of twelve years holding `year` */
export const yearPageStart = (year: number) =>
  year - (((year % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);
