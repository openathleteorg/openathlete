/**
 * The coach's questionnaires: a daily Hooper index and a weekly check-in,
 * sent to Camille and four other athletes for six weeks, answered most days.
 * Camille's answers follow her training: tired after the big trail weekend,
 * fresher in the taper.
 */
import type { Prisma, PrismaClient } from '../../../libs/database/generated/client';
import { addDays, at, weekday } from './dates';
import { Random, hashSeed } from './random';

type Db = PrismaClient;

const WEEKS = 6;
/** Days placed ahead: a series sent for weeks keeps going after today */
const AHEAD = 14;
const json = (value: unknown) => value as Prisma.InputJsonValue;

const scale = (min: number, max: number, minLabel: string, maxLabel: string) =>
  json({ min, max, step: 1, minLabel, maxLabel, display: max - min > 10 ? 'SLIDER' : 'BUTTONS' });

const HOOPER = ['Fatigue', 'Stress', 'Muscle soreness', 'Sleep quality'];

const MOODS = [
  { id: 'low', label: 'Low' },
  { id: 'ok', label: 'OK' },
  { id: 'high', label: 'High' },
];

/** What Camille told her coach each Sunday, the oldest first */
const CAMILLE_NOTES = [
  'Good first week back after the 10K. Legs a bit heavy on Thursday.',
  'Big week. The long trail on Saturday was hard in the heat, but I finished strong.',
  'Calf tight after the downhill reps. Iced it, it is better today.',
  'Felt flat on Tuesday, much better by the weekend. Slept badly mid-week (work).',
  'Best week so far! The tempo felt easy and I recovered fast.',
  'Starting to feel the taper. Fresh legs, a bit nervous about the race.',
];

const OTHER_NOTES = [
  'All good, nothing special.',
  'Busy at work, I moved Wednesday to Thursday.',
  'Knee a bit sore after the long run, gone the next day.',
  'Loved the hill session!',
  'Tired this week, slept less than usual.',
  '',
];

export interface QuestionnaireAthlete {
  athleteId: number;
  /** Camille's answers tell a story; the others are noise around a level */
  story: boolean;
}

/** How tired (1 fresh, 7 exhausted) Camille felt `daysAgo` days ago */
function camilleFatigue(daysAgo: number): number {
  // The big trail weekend four weeks ago, then the taper
  const bump = 2.4 * Math.exp(-(((daysAgo - 26) / 4) ** 2));
  const midWeek = 1.2 * Math.exp(-(((daysAgo - 17) / 2.5) ** 2));
  const taper = daysAgo < 8 ? -0.6 : 0;
  return 3 + bump + midWeek + taper;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

export async function seedQuestionnaires(
  db: Db,
  today: Date,
  coachUserId: number,
  athletes: QuestionnaireAthlete[],
): Promise<void> {
  const hooper = await db.questionnaire.create({
    data: {
      coachUserId,
      title: 'Hooper index',
      description: 'Four questions every morning, before training: 1 is the best, 7 the worst.',
      scoreKind: 'SUM',
      scoreMetricType: 'HOOPER_INDEX',
      createdAt: addDays(today, -WEEKS * 7 - 3),
      questions: {
        create: HOOPER.map((label, position) => ({
          position,
          type: 'SCALE',
          label,
          inScore: true,
          config:
            label === 'Sleep quality'
              ? scale(1, 7, 'Very, very good', 'Very, very bad')
              : scale(1, 7, 'Very, very low', 'Very, very high'),
        })),
      },
    },
    include: { questions: true },
  });

  const checkIn = await db.questionnaire.create({
    data: {
      coachUserId,
      title: 'Weekly check-in',
      description: 'How your week went, in two minutes.',
      createdAt: addDays(today, -WEEKS * 7 - 3),
      questions: {
        create: [
          { position: 0, type: 'SCALE', label: 'How did the week feel?', config: scale(1, 10, 'Very hard', 'Very easy') },
          {
            position: 1,
            type: 'NUMBER',
            label: 'Average sleep per night',
            config: json({ unit: 'h', min: 0, max: 14, decimals: 1 }),
          },
          { position: 2, type: 'SINGLE_CHOICE', label: 'Motivation', config: json({ options: MOODS }) },
          { position: 3, type: 'YES_NO', label: 'Any pain or niggle?', config: json({}) },
          { position: 4, type: 'LONG_TEXT', label: 'Anything to tell me?', required: false, config: json({}) },
        ],
      },
    },
    include: { questions: true },
  });
  const [feel, sleep, motivation, pain, notes] = checkIn.questions.sort((a, b) => a.position - b.position);
  const hooperQuestions = hooper.questions.sort((a, b) => a.position - b.position);

  for (const athlete of athletes) {
    const rng = new Random(hashSeed(`questionnaires-${athlete.athleteId}`));
    const level = rng.range(2.6, 3.6);
    const hooperSeries = `seed-hooper-${athlete.athleteId}`;
    const checkInSeries = `seed-check-in-${athlete.athleteId}`;
    const metrics: Prisma.AthleteMetricCreateManyInput[] = [];

    // Every morning at 7:00, today's still waiting, the next ones to come
    for (let daysAgo = WEEKS * 7 - 1; daysAgo >= -AHEAD; daysAgo--) {
      const day = addDays(today, -daysAgo);
      const opens = at(day, 7);
      const answered = daysAgo > 0 && rng.chance(athlete.story ? 0.93 : 0.82);
      const base = athlete.story ? camilleFatigue(daysAgo) : level + rng.normal(0, 0.5);
      const values = [
        clamp(base + rng.normal(0, 0.4), 1, 7),
        clamp(base - 0.6 + rng.normal(0, 0.6), 1, 7),
        clamp(base + 0.3 + rng.normal(0, 0.5), 1, 7),
        clamp(base - 0.4 + rng.normal(0, 0.7), 1, 7),
      ];
      const score = values.reduce((sum, value) => sum + value, 0);
      await db.event.create({
        data: {
          type: 'QUESTIONNAIRE',
          name: hooper.title,
          athleteId: athlete.athleteId,
          startDate: opens,
          endDate: opens,
          seriesId: hooperSeries,
          questionnaire: {
            create: {
              questionnaireId: hooper.questionnaireId,
              ...(answered && {
                answeredAt: at(day, 7, rng.int(5, 90)),
                score,
                notifiedAt: opens,
                answers: {
                  create: hooperQuestions.map((question, index) => ({
                    questionId: question.questionId,
                    valueNumber: values[index],
                  })),
                },
              }),
            },
          },
        },
      });
      if (answered) metrics.push({ athleteId: athlete.athleteId, type: 'HOOPER_INDEX', value: score, date: day });
    }

    // Every Sunday at 18:00
    let week = 0;
    for (let daysAgo = WEEKS * 7 - 1; daysAgo >= -AHEAD; daysAgo--) {
      const day = addDays(today, -daysAgo);
      if (weekday(day) !== 6) continue;
      const opens = at(day, 18);
      const answered = daysAgo > 0 && (athlete.story || rng.chance(0.85));
      const hard = athlete.story ? camilleFatigue(daysAgo + 2) : level + rng.normal(0, 0.6);
      const text = athlete.story ? CAMILLE_NOTES[week % CAMILLE_NOTES.length] : rng.pick(OTHER_NOTES);
      week++;
      await db.event.create({
        data: {
          type: 'QUESTIONNAIRE',
          name: checkIn.title,
          athleteId: athlete.athleteId,
          startDate: opens,
          endDate: opens,
          seriesId: checkInSeries,
          questionnaire: {
            create: {
              questionnaireId: checkIn.questionnaireId,
              ...(answered && {
                answeredAt: at(day, 19, rng.int(0, 120)),
                notifiedAt: opens,
                answers: {
                  create: [
                    { questionId: feel.questionId, valueNumber: clamp(11 - hard * 1.3 + rng.normal(0, 0.8), 1, 10) },
                    { questionId: sleep.questionId, valueNumber: Math.round(rng.normal(hard > 4.5 ? 6.6 : 7.4, 0.3) * 10) / 10 },
                    { questionId: motivation.questionId, valueOptions: [hard > 4.8 ? 'ok' : rng.chance(0.75) ? 'high' : 'ok'] },
                    { questionId: pain.questionId, valueNumber: text.match(/tight|sore/i) ? 1 : 0 },
                    ...(text ? [{ questionId: notes.questionId, valueText: text }] : []),
                  ],
                },
              }),
            },
          },
        },
      });
    }

    // The answers fill the metric, unless a device measured it
    await db.athleteMetric.createMany({ data: metrics, skipDuplicates: true });
  }
}
