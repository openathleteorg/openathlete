import { emailLanguageSchema } from '@openathlete/shared';

import { sharpLoadRise } from '../../../weekly/weekly-email.service';
import {
  CoachWeeklyAthlete,
  CoachWeeklyProps,
  buildCoachWeeklyEmail,
} from './coach-weekly.template';

const athlete = (
  overrides: Partial<CoachWeeklyAthlete> = {},
): CoachWeeklyAthlete => ({
  name: 'Ana Lopez',
  missed: 2,
  loadRise: 0.45,
  answers: 1,
  calendarUrl: 'https://app.example/dashboard/calendar/7',
  ...overrides,
});

function props(overrides: Partial<CoachWeeklyProps> = {}): CoachWeeklyProps {
  return {
    language: 'FR',
    name: 'Léa',
    signature: 'Tristan',
    footer: { kind: 'account' },
    athletes: [athlete()],
    dashboardUrl: 'https://app.example/dashboard/coach',
    garmin: false,
    ...overrides,
  };
}

describe('buildCoachWeeklyEmail', () => {
  it('names each athlete with what to look at', () => {
    const email = buildCoachWeeklyEmail(props());
    expect(email.subject).toBe('Tes athlètes : 1 à regarder cette semaine');
    expect(email.text).toContain(
      'Ana Lopez : 2 séances manquées · charge en forte hausse : +45 % sur la moyenne des 4 semaines d’avant · 1 questionnaire rempli. Son calendrier (https://app.example/dashboard/calendar/7)',
    );
    expect(email.text).toContain(
      'Ouvrir le tableau de bord: https://app.example/dashboard/coach',
    );
  });

  it('only says what applies', () => {
    const { text } = buildCoachWeeklyEmail(
      props({
        language: 'EN',
        athletes: [athlete({ missed: 0, loadRise: null, answers: 3 })],
      }),
    );
    expect(text).toContain('Ana Lopez: 3 questionnaires answered. ');
  });

  it('shows fifteen athletes, then counts the others', () => {
    const athletes = Array.from({ length: 17 }, (_, i) =>
      athlete({ name: `Athlete ${i}` }),
    );
    const { text } = buildCoachWeeklyEmail(props({ athletes }));
    expect(text).toContain('Athlete 14');
    expect(text).not.toContain('Athlete 15');
    expect(text).toContain('Et 2 autres athlètes.');
  });

  it.each(emailLanguageSchema.options)('is written in %s', (language) => {
    const email = buildCoachWeeklyEmail(props({ language, garmin: true }));
    expect(email.subject).toBeTruthy();
    expect(email.text).not.toContain('undefined');
  });
});

describe('sharpLoadRise', () => {
  it('flags a week 30% and 50 TRIMP above the usual one', () => {
    expect(sharpLoadRise(200, 100)).toBe(1);
    expect(sharpLoadRise(130, 100)).toBeNull();
    expect(sharpLoadRise(200, 150)).toBeCloseTo(1 / 3);
  });

  it('ignores small loads and athletes without a usual load', () => {
    expect(sharpLoadRise(60, 20)).toBeNull();
    expect(sharpLoadRise(300, 0)).toBeNull();
  });
});
