import { emailLanguageSchema } from '@openathlete/shared';

import {
  WeeklyRecapProps,
  buildWeeklyRecapEmail,
  fatigueTrend,
  formStatus,
} from './weekly-recap.template';

const empty = {
  count: 0,
  distance: 0,
  movingTime: 0,
  elevationGain: 0,
  trimp: 0,
};

function props(overrides: Partial<WeeklyRecapProps> = {}): WeeklyRecapProps {
  return {
    language: 'FR',
    name: 'Ana',
    signature: 'Tristan',
    footer: {
      kind: 'list',
      reason: 'Why',
      unsubscribeUrl: 'https://app.example/emails/unsubscribe?token=t',
      preferencesUrl: 'https://app.example/dashboard/settings?tab=profile',
    },
    past: {
      count: 4,
      distance: 42_000,
      movingTime: 4 * 3600 + 5 * 60,
      elevationGain: 1850,
      trimp: 412,
      planned: 0,
      done: 0,
    },
    previous: { ...empty, count: 3, movingTime: 3 * 3600, trimp: 350 },
    form: { ctl: 48, atl: 61, atlWeekBefore: 52 },
    upcoming: [
      { date: '2026-11-24', name: 'Footing', duration: 45 * 60 },
      { date: '2026-11-26', name: 'Fractionné <10×400>', duration: null },
    ],
    nextRace: { name: 'Marathon de Lyon', daysLeft: 33 },
    calendarUrl: 'https://app.example/dashboard/calendar?utm_campaign=x',
    garmin: false,
    supporters: null,
    ...overrides,
  };
}

describe('buildWeeklyRecapEmail', () => {
  it('puts the figure of the week in the subject', () => {
    // Narrow no-break spaces and no-break spaces, as Intl writes them
    const subject = buildWeeklyRecapEmail(props()).subject.replace(
      /[\u202f\u00a0]/g,
      ' ',
    );
    expect(subject).toBe('Ta semaine : 4 séances, 42 km, 1 850 m D+');
  });

  it('counts sessions done against planned when there was a plan', () => {
    const email = buildWeeklyRecapEmail(
      props({ past: { ...props().past, planned: 5, done: 3 } }),
    );
    expect(email.subject).toBe('Ta semaine : 3 séances sur 5 prévues');
    expect(email.text).toContain('Séances: 3 sur 5');
  });

  it('compares the load with the week before, and tells the form', () => {
    const { text } = buildWeeklyRecapEmail(props());
    expect(text).toContain('Charge : 412 TRIMP. 18 % de plus');
    expect(text).toContain('Forme (CTL): 48');
    expect(text).toContain('Fatigue (ATL): 61');
    expect(text).toContain('Équilibre : fraîcheur (TSB) à -13.');
    expect(text).toContain('Fatigue en hausse : la semaine a été chargée.');
  });

  it('lists the week to come, then the race', () => {
    const { text, html } = buildWeeklyRecapEmail(props());
    expect(text).toContain('Mar. 24: Footing · 45 min');
    expect(text).toContain('Jeu. 26: Fractionné <10×400>');
    expect(html).toContain('Fractionné &lt;10×400&gt;');
    expect(text).toContain(
      'Prochaine course : Marathon de Lyon, dans 33 jours.',
    );
    expect(text).toContain(
      'Voir ma semaine: https://app.example/dashboard/calendar',
    );
  });

  it('asks to plan the week instead of showing an empty list', () => {
    const { text } = buildWeeklyRecapEmail(
      props({ upcoming: [], nextRace: null }),
    );
    expect(text).toContain('Rien de prévu pour l’instant.');
    expect(text).toContain('Planifie ta semaine: https://app.example');
    expect(text).not.toContain('Voir ma semaine');
  });

  it('tells a week of rest without empty figures', () => {
    const email = buildWeeklyRecapEmail(
      props({ past: { ...empty, planned: 0, done: 0 }, form: null }),
    );
    expect(email.subject).toBe('Ta semaine : une semaine de repos');
    expect(email.text).toContain('Aucune séance enregistrée');
    expect(email.text).not.toContain('Forme (CTL)');
  });

  it('carries the Garmin attribution only with Garmin data', () => {
    expect(buildWeeklyRecapEmail(props()).text).not.toContain('Garmin');
    expect(buildWeeklyRecapEmail(props({ garmin: true })).text).toContain(
      "Analyses issues en partie de données d'appareils Garmin.",
    );
  });

  it('shows the Supporter bar only when given, with the real count', () => {
    expect(buildWeeklyRecapEmail(props()).text).not.toContain('Supporters');
    const { text, html } = buildWeeklyRecapEmail(
      props({
        supporters: {
          count: 23,
          goal: 100,
          url: 'https://app.example/dashboard/settings?tab=subscription',
        },
      }),
    );
    expect(text).toContain('Supporters : 23 sur un objectif de 100.');
    expect(html).toContain('width="23%"');
  });

  it('leaves room for one sentence of analysis', () => {
    const { text } = buildWeeklyRecapEmail(
      props({ insight: 'Belle régularité.' }),
    );
    expect(text).toContain('Belle régularité.');
  });

  it.each(emailLanguageSchema.options)('is written in %s', (language) => {
    const email = buildWeeklyRecapEmail(
      props({ language, garmin: true, upcoming: [] }),
    );
    expect(email.subject).toBeTruthy();
    expect(email.html).toContain('<html lang=');
    expect(email.text).not.toContain('undefined');
  });
});

describe('form words', () => {
  it('classifies the form like the app', () => {
    expect(formStatus(-21)).toBe('fatigue');
    expect(formStatus(-20)).toBe('balanced');
    expect(formStatus(25)).toBe('balanced');
    expect(formStatus(26)).toBe('fresh');
  });

  it('calls a trend only past a few points of fatigue', () => {
    expect(fatigueTrend(55, 52)).toBe('up');
    expect(fatigueTrend(53, 52)).toBe('stable');
    expect(fatigueTrend(40, 52)).toBe('down');
  });
});
