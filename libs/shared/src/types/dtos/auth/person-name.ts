import { z } from 'zod';

export const PERSON_NAME_MAX_LENGTH = 50;

// Letters of any script, with the marks, spaces, apostrophes, hyphens and
// dots that names use; no digits, symbols, emoji or URL characters
const NAME_CHARACTERS = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u;
// "site.com", "bit.ly": a domain, unlike initials such as "J.-P."
const DOMAIN_LIKE = /\p{L}{2,}\.\p{L}{2,}/u;

/**
 * Whether a first or last name looks like one. Names are printed in the
 * emails sent to the address of the account: robots signed up with ads as
 * names, to have OpenAthlete deliver them to strangers.
 */
export function isPlausiblePersonName(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= PERSON_NAME_MAX_LENGTH &&
    NAME_CHARACTERS.test(trimmed) &&
    !DOMAIN_LIKE.test(trimmed)
  );
}

/** First or last name typed by a person (sign up, profile). */
export const personNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(PERSON_NAME_MAX_LENGTH)
  .refine(isPlausiblePersonName, 'Invalid name');
