const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Every word of the query, in any order, without regard to accents */
export function matchesQuery(label: string, query: string): boolean {
  const target = normalize(label);
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => target.includes(word));
}
