import { Language } from 'src/common/constants/languages.constant';

import { FeedContext, describeFeedEvent } from './calendar-feed-event';

type FeedEvent = Parameters<typeof describeFeedEvent>[0];

const context: FeedContext = {
  language: Language.EN,
  metrics: { VMA: 18 },
  zoneNames: new Map([[7, 'Endurance']]),
  url: 'https://app.example/dashboard/calendar?event=1',
};

const step = (fields: object) => ({
  stepType: 'STEADY',
  name: null,
  notes: null,
  durationType: 'TIME',
  durationValue: 600,
  targets: [],
  repeatBlock: null,
  ...fields,
});

const event = (fields: object) =>
  ({
    eventId: 1,
    name: 'Session',
    type: 'TRAINING',
    startDate: new Date('2026-11-05T08:00:00Z'),
    endDate: new Date('2026-11-05T09:00:00Z'),
    training: null,
    competition: null,
    note: null,
    ...fields,
  }) as unknown as FeedEvent;

const training = (fields: object) => ({
  sport: 'RUNNING',
  description: '',
  goalDistance: null,
  goalElevationGain: null,
  goalDuration: null,
  goalRpe: null,
  estimatedLoad: null,
  workout: null,
  ...fields,
});

const zoneTarget = {
  targetType: 'ZONE',
  targetValue: 7,
  targetMin: null,
  targetMax: null,
  metricType: null,
};

describe('describeFeedEvent', () => {
  it('lays out a whole session', () => {
    const { description, categories } = describeFeedEvent(
      event({
        training: training({
          description: ' Keep it relaxed ',
          goalDistance: 12500,
          goalElevationGain: 150.4,
          goalDuration: 4500,
          goalRpe: 0.7,
          estimatedLoad: 84.6,
          workout: {
            steps: [
              step({
                stepType: 'WARMUP',
                durationValue: 900,
                targets: [zoneTarget],
              }),
              step({
                stepType: 'REPEAT',
                durationType: 'OPEN',
                durationValue: null,
                repeatBlock: {
                  repetitions: 5,
                  childSteps: [
                    step({
                      stepType: 'INTERVAL_ACTIVE',
                      name: 'Hill',
                      durationType: 'DISTANCE',
                      durationValue: 400,
                      notes: 'Tall',
                      targets: [
                        {
                          targetType: 'PACE',
                          targetMin: 0.9,
                          targetMax: 1,
                          targetValue: null,
                          metricType: 'VMA',
                        },
                      ],
                    }),
                    step({ stepType: 'INTERVAL_REST', durationValue: 90 }),
                  ],
                },
              }),
            ],
          },
        }),
      }),
      context,
    );

    expect(description).toBe(
      [
        'Sport: Running',
        'Duration: 1 h 15',
        'Distance: 12.5 km',
        'Elevation gain: 150 m',
        'Target RPE: 7/10',
        'Estimated load: 85',
        '',
        'Keep it relaxed',
        '',
        'Workout:',
        '- Warm-up · 15 min · Endurance',
        '- 5 ×',
        '  - Hill · 400 m · 3:42 - 3:20 min/km · Tall',
        '  - Recovery · 1 min 30',
        '',
        `Open in OpenAthlete: ${context.url}`,
      ].join('\n'),
    );
    expect(categories).toEqual(['Session', 'Running']);
  });

  it("gives a percentage rather than an average athlete's pace", () => {
    const { description } = describeFeedEvent(
      event({
        training: training({
          workout: {
            steps: [
              step({
                targets: [
                  {
                    targetType: 'POWER',
                    targetMin: 0.9,
                    targetMax: 1,
                    targetValue: null,
                    metricType: 'FTP_CYCLING',
                  },
                ],
              }),
            ],
          },
        }),
      }),
      { ...context, url: null },
    );

    expect(description).toContain('90% - 100% FTP CYCLING');
    expect(description).not.toContain(' W');
    expect(description).not.toContain('OpenAthlete');
  });

  it('shows the priority of a race, in the language of the athlete', () => {
    const { description, categories } = describeFeedEvent(
      event({
        type: 'COMPETITION',
        competition: {
          ...training({ sport: 'TRAIL_RUNNING', goalDistance: 42195 }),
          priority: 'A',
        },
      }),
      { ...context, language: Language.FR, url: null },
    );

    expect(description).toBe('Sport: Trail\nPriorité: A\nDistance: 42,2 km');
    expect(categories).toEqual(['Compétition', 'Trail']);
  });

  it('keeps a note to its text', () => {
    expect(
      describeFeedEvent(
        event({ type: 'NOTE', note: { description: 'Ski trip' } }),
        { ...context, url: null },
      ),
    ).toEqual({ description: 'Ski trip', categories: ['Note'] });
  });

  it('has no description when there is nothing to say', () => {
    expect(
      describeFeedEvent(event({ type: 'NOTE', note: { description: ' ' } }), {
        ...context,
        url: null,
      }).description,
    ).toBeNull();
  });
});
