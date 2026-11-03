/**
 * The coach's other athletes: lighter data (ten weeks of activities without
 * recordings, a planned fortnight around today) but each with a story the
 * coach dashboard tells: on track, behind, coming back from injury, gone
 * quiet.
 */
import type { ConnectorProvider, Gender, SportType } from '../../../libs/database/generated/client';

export interface RosterAthlete {
  firstName: string;
  lastName: string;
  gender: Gender;
  provider: ConnectorProvider;
  /** Main sports, the first one most often */
  sports: SportType[];
  /** Sessions a week */
  frequency: number;
  /** Easy running speed, m/s */
  runSpeed: number;
  hrRest: number;
  hrMax: number;
  /** Share of planned sessions done */
  compliance: number;
  /** Days without activity before today (gone quiet) */
  quietDays?: number;
  injury?: { location: string; painScore: number; context: string };
  /** Message waiting for the coach */
  unread?: string;
}

export const ROSTER: RosterAthlete[] = [
  {
    firstName: 'Léa', lastName: 'Martin', gender: 'FEMALE', provider: 'GARMIN',
    sports: ['RUNNING', 'CYCLING', 'SWIMMING'], frequency: 8, runSpeed: 3.2, hrRest: 49, hrMax: 189, compliance: 0.95,
    unread: 'Pool was closed this morning, I swapped the swim for 45 minutes on the turbo. Is that ok?',
  },
  {
    firstName: 'Thomas', lastName: 'Bernard', gender: 'MALE', provider: 'STRAVA',
    sports: ['RUNNING'], frequency: 6, runSpeed: 3.35, hrRest: 44, hrMax: 186, compliance: 0.9,
  },
  {
    firstName: 'Sofia', lastName: 'Rossi', gender: 'FEMALE', provider: 'COROS',
    sports: ['TRAIL_RUNNING', 'RUNNING'], frequency: 6, runSpeed: 3.0, hrRest: 47, hrMax: 192, compliance: 0.85,
    unread: 'Just signed up for the Lavaredo Ultra Trail in June 🎉 Can we talk about the winter plan?',
  },
  {
    firstName: 'Lucas', lastName: 'Petit', gender: 'MALE', provider: 'STRAVA',
    sports: ['GRAVEL_RIDE', 'CYCLING'], frequency: 5, runSpeed: 3.1, hrRest: 46, hrMax: 188, compliance: 0.8,
  },
  {
    firstName: 'Amélie', lastName: 'Dubois', gender: 'FEMALE', provider: 'GARMIN',
    sports: ['RUNNING', 'CYCLING'], frequency: 4, runSpeed: 2.95, hrRest: 52, hrMax: 190, compliance: 0.7,
    injury: { location: 'Right Achilles', painScore: 3, context: 'Stiff in the morning, eases after 10 minutes of running.' },
  },
  {
    firstName: 'Hugo', lastName: 'Lefèvre', gender: 'MALE', provider: 'POLAR',
    sports: ['RUNNING'], frequency: 5, runSpeed: 3.45, hrRest: 45, hrMax: 195, compliance: 0.45,
  },
  {
    firstName: 'Inès', lastName: 'Garcia', gender: 'FEMALE', provider: 'SUUNTO',
    sports: ['RUNNING', 'SWIMMING', 'CYCLING'], frequency: 7, runSpeed: 3.05, hrRest: 50, hrMax: 191, compliance: 0.9,
  },
  {
    firstName: 'Maxime', lastName: 'Roux', gender: 'MALE', provider: 'GARMIN',
    sports: ['TRAIL_RUNNING', 'RUNNING'], frequency: 5, runSpeed: 3.1, hrRest: 48, hrMax: 190, compliance: 0.75,
    quietDays: 9,
  },
  {
    firstName: 'Chloé', lastName: 'Fontaine', gender: 'FEMALE', provider: 'STRAVA',
    sports: ['RUNNING'], frequency: 5, runSpeed: 3.1, hrRest: 51, hrMax: 193, compliance: 1,
  },
  {
    firstName: 'Nathan', lastName: 'Girard', gender: 'MALE', provider: 'COROS',
    sports: ['CYCLING', 'RUNNING', 'SWIMMING'], frequency: 9, runSpeed: 3.25, hrRest: 43, hrMax: 184, compliance: 0.88,
  },
  {
    firstName: 'Emma', lastName: 'Chevalier', gender: 'FEMALE', provider: 'GARMIN',
    sports: ['TRAIL_RUNNING', 'HIKING', 'RUNNING'], frequency: 4, runSpeed: 2.85, hrRest: 53, hrMax: 194, compliance: 0.6,
  },
];

/** Athlete invited by the coach who has not answered yet. */
export const PENDING_INVITE = { email: 'yanis.benali@openathlete.org' };
