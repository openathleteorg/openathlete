/**
 * A race preparation page. Facts that do not depend on the language live
 * here; the words (name, course, weather, advice, FAQ) are messages named
 * `races_<key>_<field>`, see `copy.ts`.
 */
export type RaceKind = 'road' | 'trail';

export interface RaceSource {
  label: string;
  url: string;
}

export interface Race {
  /** URL segment: `/races/<slug>`. */
  slug: string;
  /** Message prefix: `races_<key>_name`, `races_<key>_h1`… */
  key: string;
  kind: RaceKind;
  /** Year of the next edition, as printed in titles. */
  year: number;
  /**
   * Date of the next edition, only once the organisers have announced it
   * (YYYY-MM-DD, local). Without it the page gives the usual period.
   */
  date?: string;
  /** Last day, for races over two days (London 2027, the SaintéLyon). */
  endDate?: string;
  /** Usual month of the race (1–12): groups the hub when no date is set. */
  month: number;
  /** Official distance in km. */
  distanceKm: number;
  /** Elevation gain and loss in metres, when the organisers publish them. */
  gainM?: number;
  lossM?: number;
  /**
   * The gain comes from GPS data (marathon-index.com), not from the
   * organisers: the page says so.
   */
  gainEstimate?: boolean;
  /**
   * The elevation row is a sentence (`races_<key>_elevation`) instead of a
   * figure: when the organisers give something else than a gain, or the
   * course is not out yet.
   */
  elevationText?: boolean;
  officialUrl: string;
  /** Where each fact on the page comes from. */
  sources: readonly RaceSource[];
  /** For the SportsEvent JSON-LD: city and ISO country code. */
  place: { city: string; country: string };
}
