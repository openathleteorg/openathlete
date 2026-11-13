import { describe, expect, it } from 'vitest';

import { parseMemberList } from './member-list';

describe('parseMemberList', () => {
  it('reads a spreadsheet export with a header, in French', () => {
    const csv = [
      'Prénom;Nom;Email;Groupe',
      'Ana;Martin;ANA@example.com;Juniors',
      'Ben;Durand;ben@example.com;',
    ].join('\n');
    expect(parseMemberList(csv)).toEqual({
      people: [
        {
          email: 'ana@example.com',
          firstName: 'Ana',
          lastName: 'Martin',
          group: 'Juniors',
        },
        { email: 'ben@example.com', firstName: 'Ben', lastName: 'Durand' },
      ],
      invalidLines: [],
    });
  });

  it('finds the email in a pasted list without a header', () => {
    expect(
      parseMemberList('Ana, Martin, ana@example.com, Track\nben@example.com'),
    ).toEqual({
      people: [
        {
          email: 'ana@example.com',
          firstName: 'Ana',
          lastName: 'Martin',
          group: 'Track',
        },
        { email: 'ben@example.com' },
      ],
      invalidLines: [],
    });
  });

  it('splits a full name column, and reports lines without an email', () => {
    const csv =
      'Name\tE-mail\n"Ana Lou Martin"\tana@example.com\nBen\tnot-an-email\n';
    expect(parseMemberList(csv)).toEqual({
      people: [
        { email: 'ana@example.com', firstName: 'Ana', lastName: 'Lou Martin' },
      ],
      invalidLines: [3],
    });
  });
});
