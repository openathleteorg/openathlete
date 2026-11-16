/**
 * Annecy Lakeside Runners, the club Julien owns: two more staff, eighteen
 * members on top of his own athletes, four groups, a shared library and the
 * weekly club sessions. With them his sidebar holds thirty athletes.
 */
import type { RosterAthlete } from './roster';

export const CLUB_NAME = 'Annecy Lakeside Runners';
export const CLUB_DESCRIPTION = 'Running, trail and triathlon around the lake since 1987. Track on Tuesdays, trail on Thursdays, long run on Sundays.';

export interface Staff {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  role: 'ADMIN' | 'ASSISTANT';
}

export const STAFF: Staff[] = [
  { firstName: 'Claire', lastName: 'Vidal', gender: 'FEMALE', role: 'ADMIN' },
  { firstName: 'Romain', lastName: 'Blanc', gender: 'MALE', role: 'ASSISTANT' },
];

export type GroupKey = 'marathon' | 'trail' | 'triathlon' | 'beginners';

export const GROUPS: { key: GroupKey; name: string; staff: ('julien' | 'claire' | 'romain')[] }[] = [
  { key: 'marathon', name: 'Road · Marathon', staff: ['julien'] },
  { key: 'trail', name: 'Trail', staff: ['claire'] },
  { key: 'triathlon', name: 'Triathlon', staff: ['claire', 'julien'] },
  { key: 'beginners', name: 'Beginners · 10 km', staff: ['romain'] },
];

/** Julien's own athletes, by last name, and Camille's group */
export const ROSTER_GROUPS: Record<string, GroupKey> = {
  Martin: 'triathlon',
  Bernard: 'marathon',
  Rossi: 'trail',
  Petit: 'triathlon',
  Dubois: 'beginners',
  Lefèvre: 'marathon',
  Garcia: 'triathlon',
  Roux: 'trail',
  Fontaine: 'marathon',
  Girard: 'triathlon',
  Chevalier: 'trail',
};

const member = (
  firstName: string,
  lastName: string,
  gender: 'MALE' | 'FEMALE',
  group: GroupKey,
  rest: Partial<RosterAthlete> = {},
): RosterAthlete & { group: GroupKey } => {
  const road = group === 'marathon' || group === 'beginners';
  return {
    firstName,
    lastName,
    gender,
    group,
    provider: (['GARMIN', 'STRAVA', 'COROS', 'SUUNTO', 'POLAR'] as const)[lastName.length % 5],
    sports:
      group === 'trail'
        ? ['TRAIL_RUNNING', 'RUNNING']
        : group === 'triathlon'
          ? ['RUNNING', 'CYCLING', 'SWIMMING']
          : ['RUNNING'],
    frequency: group === 'beginners' ? 3 : road ? 5 : 6,
    runSpeed: group === 'beginners' ? 2.6 : group === 'marathon' ? 3.3 : 3.0,
    hrRest: 46 + (lastName.length % 9),
    hrMax: 183 + (firstName.length % 11),
    compliance: 0.7 + (lastName.length % 4) * 0.08,
    ...rest,
  };
};

/** Club members Julien reaches only through the club */
export const CLUB_MEMBERS: (RosterAthlete & { group: GroupKey })[] = [
  member('Julie', 'Morel', 'FEMALE', 'marathon'),
  member('Antoine', 'Laurent', 'MALE', 'marathon', { compliance: 0.95 }),
  member('Manon', 'Simon', 'FEMALE', 'marathon'),
  member('Pierre', 'Michel', 'MALE', 'marathon', { quietDays: 6 }),
  member('Sarah', 'Lambert', 'FEMALE', 'trail'),
  member('Baptiste', 'Faure', 'MALE', 'trail', { compliance: 0.9 }),
  member('Clara', 'Mercier', 'FEMALE', 'trail'),
  member('Théo', 'Bonnet', 'MALE', 'trail', {
    injury: { location: 'Left knee', painScore: 4, context: 'Outside of the knee after long descents.' },
  }),
  member('Camille', 'Perrin', 'FEMALE', 'triathlon'),
  member('Louis', 'Robin', 'MALE', 'triathlon'),
  member('Margaux', 'Clément', 'FEMALE', 'triathlon', { compliance: 0.98 }),
  member('Alice', 'Guerin', 'FEMALE', 'beginners'),
  member('Paul', 'Muller', 'MALE', 'beginners'),
  member('Zoé', 'Henry', 'FEMALE', 'beginners', { compliance: 0.6 }),
  member('Victor', 'Roussel', 'MALE', 'beginners'),
  member('Lina', 'Nicolas', 'FEMALE', 'beginners'),
  member('Jules', 'Gauthier', 'MALE', 'beginners', { quietDays: 11 }),
  member('Elise', 'Masson', 'FEMALE', 'beginners'),
];

/** Personal invitations sent from the imported member list, not yet accepted */
export const PENDING_CLUB_INVITATIONS: { firstName: string; lastName: string; group: GroupKey; daysAgo: number }[] = [
  { firstName: 'Mathis', lastName: 'Chevallier', group: 'beginners', daysAgo: 2 },
  { firstName: 'Anaïs', lastName: 'Lemoine', group: 'beginners', daysAgo: 2 },
  { firstName: 'Quentin', lastName: 'Barbier', group: 'trail', daysAgo: 5 },
  { firstName: 'Océane', lastName: 'Renaud', group: 'marathon', daysAgo: 9 },
];
