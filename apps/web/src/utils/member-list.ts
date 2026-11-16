/**
 * A club's member list as people paste it or export it from a spreadsheet:
 * one person per line, columns split by commas, semicolons or tabs, with or
 * without a header. Without a header, the column with an @ is the email,
 * and the others are first name, last name and group, in that order.
 */
export type ParsedPerson = {
  email: string;
  firstName?: string;
  lastName?: string;
  group?: string;
};

export type ParsedList = {
  people: ParsedPerson[];
  /** Lines without a usable email, 1-based as in the file */
  invalidLines: number[];
};

type Column = 'email' | 'firstName' | 'lastName' | 'group' | 'name';

const HEADERS: Record<string, Column> = {
  email: 'email',
  'e-mail': 'email',
  mail: 'email',
  courriel: 'email',
  'adresse email': 'email',
  'adresse e-mail': 'email',
  'first name': 'firstName',
  firstname: 'firstName',
  prénom: 'firstName',
  prenom: 'firstName',
  nome: 'firstName',
  vorname: 'firstName',
  'last name': 'lastName',
  lastname: 'lastName',
  surname: 'lastName',
  nom: 'lastName',
  'nom de famille': 'lastName',
  cognome: 'lastName',
  apellido: 'lastName',
  sobrenome: 'lastName',
  nachname: 'lastName',
  name: 'name',
  group: 'group',
  groupe: 'group',
  gruppo: 'group',
  grupo: 'group',
  gruppe: 'group',
};

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

function separatorOf(line: string): string {
  const counts = [',', ';', '\t'].map(
    (separator) => [separator, line.split(separator).length] as const,
  );
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

const cells = (line: string, separator: string) =>
  line.split(separator).map((cell) =>
    cell
      .trim()
      .replace(/^"(.*)"$/, '$1')
      .trim(),
  );

export function parseMemberList(text: string): ParsedList {
  const lines = text.split(/\r?\n/);
  const firstLine = lines.find((line) => line.trim()) ?? '';
  const separator = separatorOf(firstLine);
  const firstCells = cells(firstLine, separator).map((cell) =>
    cell.toLocaleLowerCase(),
  );
  const hasHeader =
    firstCells.some((cell) => cell in HEADERS) &&
    !firstCells.some((cell) => EMAIL.test(cell));
  const columns: (Column | null)[] | null = hasHeader
    ? firstCells.map((cell) => HEADERS[cell] ?? null)
    : null;

  const people: ParsedPerson[] = [];
  const invalidLines: number[] = [];
  let headerSkipped = false;
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    if (hasHeader && !headerSkipped) {
      headerSkipped = true;
      return;
    }
    const values = cells(line, separator);
    const person: ParsedPerson = { email: '' };
    if (columns) {
      columns.forEach((column, i) => {
        const value = values[i];
        if (!column || !value) return;
        if (column === 'name') {
          const [first, ...rest] = value.split(/\s+/);
          person.firstName ??= first;
          if (rest.length) person.lastName ??= rest.join(' ');
        } else if (column === 'email') {
          person.email = value.toLocaleLowerCase();
        } else {
          person[column] = value;
        }
      });
    } else {
      const emailIndex = values.findIndex((value) => EMAIL.test(value));
      if (emailIndex >= 0)
        person.email = values[emailIndex].toLocaleLowerCase();
      const [firstName, lastName, group] = values.filter(
        (_, i) => i !== emailIndex,
      );
      if (firstName) person.firstName = firstName;
      if (lastName) person.lastName = lastName;
      if (group) person.group = group;
    }
    if (EMAIL.test(person.email)) people.push(person);
    else invalidLines.push(index + 1);
  });
  return { people, invalidLines };
}
