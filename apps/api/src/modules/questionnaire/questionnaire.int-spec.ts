import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  EVENT_TYPE,
  METRIC_TYPE,
  QUESTIONNAIRE_SCORE,
  QUESTIONNAIRE_STATUS,
  QUESTION_TYPE,
  type QuestionInput,
  type Questionnaire,
  type QuestionnaireInput,
  questionnaireInputSchema,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { EventBulkService } from 'src/modules/core/services/event-bulk.service';
import { EventSeriesService } from 'src/modules/core/services/event-series.service';
import { EventService } from 'src/modules/core/services/event.service';
import { MetricService } from 'src/modules/core/services/metric.service';
import { EmailTransportService } from 'src/modules/notification/services/email-transport.service';
import { PushNotificationService } from 'src/modules/notification/services/push-notification.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { QuestionnaireNotificationScheduler } from './services/questionnaire-notification.scheduler';
import { QuestionnaireResponseService } from './services/questionnaire-response.service';
import { QuestionnaireService } from './services/questionnaire.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// Coach 10 coaches athlete 200 (user 20) directly and athlete 300 (user 30)
// for club 1, where coach 50 coaches athlete 300 too. Coach 40 coaches
// athlete 200 on their own.
const COACH = 10;
const OTHER_COACH = 40;
const CLUB_COACH = 50;
const ATHLETE_A = 200;
const ATHLETE_B = 300;

const coach: AuthUser = {
  userId: COACH,
  email: 'coach@example.com',
  athlete: null,
  coachAthletes: [{ athleteId: ATHLETE_A }, { athleteId: ATHLETE_B }],
};
const otherCoach: AuthUser = {
  userId: OTHER_COACH,
  email: 'other@example.com',
  athlete: null,
  coachAthletes: [{ athleteId: ATHLETE_A }],
};
const clubCoach: AuthUser = {
  userId: CLUB_COACH,
  email: 'club@example.com',
  athlete: null,
  coachAthletes: [{ athleteId: ATHLETE_B }],
};
const athleteA: AuthUser = {
  userId: 20,
  email: 'a@example.com',
  athlete: { athleteId: ATHLETE_A },
  coachAthletes: [],
};
const athleteB: AuthUser = {
  userId: 30,
  email: 'b@example.com',
  athlete: { athleteId: ATHLETE_B },
  coachAthletes: [],
};

const HOUR = 3600 * 1000;
/** Monday 5 October 2026, 07:00 in Paris */
const MONDAY = new Date('2026-10-05T05:00:00Z');
const at = (start: Date, hours: number) =>
  new Date(start.getTime() + hours * HOUR);

const hooper: QuestionnaireInput = questionnaireInputSchema.parse({
  title: 'Hooper',
  scoreKind: QUESTIONNAIRE_SCORE.SUM,
  scoreMetricType: METRIC_TYPE.HOOPER_INDEX,
  questions: [
    ...['Fatigue', 'Stress', 'Soreness', 'Sleep'].map((label) => ({
      type: QUESTION_TYPE.SCALE,
      label,
      inScore: true,
      config: { min: 1, max: 7 },
    })),
    {
      type: QUESTION_TYPE.NUMBER,
      label: 'Hours slept',
      required: false,
      metricType: METRIC_TYPE.SLEEP_DURATION,
      config: { unit: 'h', min: 0, max: 24 },
    },
    { type: QUESTION_TYPE.LONG_TEXT, label: 'Anything else?', required: false },
  ],
});

describe('questionnaires (PostgreSQL)', () => {
  let prisma: PrismaService;
  let events: EventService;
  let series: EventSeriesService;
  let library: QuestionnaireService;
  let responses: QuestionnaireResponseService;
  let scheduler: QuestionnaireNotificationScheduler;
  const sendPush = jest.fn().mockResolvedValue(true);
  const sendEmail = jest.fn().mockResolvedValue(true);
  const notifyCalendar = jest.fn();

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = new CaslAbilityFactory();
    events = new EventService(
      prisma,
      abilities,
      new EventEmitter2(),
      {} as never,
      {} as never,
      { deleteExportsForWorkout: jest.fn() } as never,
      {} as never,
    );
    const bulk = new EventBulkService(prisma, abilities, events);
    series = new EventSeriesService(prisma, abilities, events, bulk);
    library = new QuestionnaireService(prisma);
    responses = new QuestionnaireResponseService(
      prisma,
      new MetricService(prisma, abilities),
      {
        notifyWeeklyLoadUpdated: notifyCalendar,
      } as unknown as CalendarWebSocketService,
    );
    const config = {
      get: (key: string) =>
        ({ APP_URL: 'https://app.example', JWT_SECRET_KEY: 'secret' })[key],
    } as unknown as ConfigService<never, true>;
    scheduler = new QuestionnaireNotificationScheduler(
      prisma,
      config,
      { sendPushNotification: sendPush } as unknown as PushNotificationService,
      {
        isEnabled: () => true,
        send: sendEmail,
      } as unknown as EmailTransportService,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    sendPush.mockClear();
    sendEmail.mockClear();
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    const now = 'now()';
    for (const sql of [
      `INSERT INTO "user" (user_id, email, password, first_name, last_name, time_zone, updated_at) VALUES
        (10, 'coach@example.com', 'x', 'Paula', 'Coach', 'Europe/Paris', ${now}),
        (20, 'a@example.com', 'x', 'Anna', 'A', 'Europe/Paris', ${now}),
        (30, 'b@example.com', 'x', 'Bob', 'B', 'Europe/Paris', ${now}),
        (40, 'other@example.com', 'x', 'Other', 'Coach', 'Europe/Paris', ${now}),
        (50, 'club@example.com', 'x', 'Club', 'Coach', 'Europe/Paris', ${now})`,
      `INSERT INTO athlete (athlete_id, user_id, updated_at) VALUES (200, 20, ${now}), (300, 30, ${now})`,
      `INSERT INTO club (club_id, name, updated_at) VALUES (1, 'Club', ${now})`,
      `INSERT INTO coach_athlete (user_id, athlete_id, club_id, updated_at) VALUES
        (10, 200, NULL, ${now}), (10, 300, 1, ${now}), (50, 300, 1, ${now}), (40, 200, NULL, ${now})`,
    ]) {
      await prisma.$executeRawUnsafe(sql);
    }
  });

  const place = (
    questionnaire: Questionnaire,
    athleteId: number,
    start = MONDAY,
    user: AuthUser = coach,
  ) =>
    events.createEvent(user, {
      type: EVENT_TYPE.QUESTIONNAIRE,
      questionnaireId: questionnaire.questionnaireId,
      name: questionnaire.title,
      athleteId,
      startDate: start,
      endDate: start,
    });

  /** Answers to the four Hooper items, then the hours slept */
  const answersOf = (questionnaire: Questionnaire, values: number[]) =>
    questionnaire.questions
      .filter((question) => question.type !== QUESTION_TYPE.LONG_TEXT)
      .map((question, index) => ({
        questionId: question.questionId,
        valueNumber: values[index] ?? null,
        valueText: null,
        valueOptions: [],
      }));

  describe('the library', () => {
    it("lists the coach's questionnaires with how they are used", async () => {
      const created = await library.create(coach, hooper);
      await library.create(otherCoach, { ...hooper, title: 'Theirs' });
      const placed = await place(created, ATHLETE_A);
      await responses.submit(
        athleteA,
        placed.eventId,
        { answers: answersOf(created, [3, 4, 2, 5, 7.5]) },
        at(MONDAY, 1),
      );
      await place(created, ATHLETE_A, at(MONDAY, 24));

      const [summary, ...others] = await library.list(coach);
      expect(others).toEqual([]);
      expect(summary).toMatchObject({
        title: 'Hooper',
        questionCount: 6,
        placedCount: 2,
        answeredCount: 1,
        hasCoach: true,
      });
      await expect(
        library.get(otherCoach, created.questionnaireId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('edits answered questions in place while their meaning holds', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);
      await responses.submit(
        athleteA,
        placed.eventId,
        { answers: answersOf(created, [3, 4, 2, 5]) },
        at(MONDAY, 1),
      );
      const [fatigue, stress, soreness, sleep, hours, text] = created.questions;

      const updated = await library.update(coach, created.questionnaireId, {
        ...hooper,
        title: 'Hooper index',
        questions: [
          // Answered, renamed: kept
          {
            ...hooper.questions[0],
            questionId: fatigue.questionId,
            label: 'Tiredness',
          },
          // Answered, rescaled: replaced
          {
            ...hooper.questions[1],
            questionId: stress.questionId,
            config: { ...(hooper.questions[1].config as object), max: 10 },
            inScore: false,
          } as QuestionInput,
          { ...hooper.questions[2], questionId: soreness.questionId },
          { ...hooper.questions[3], questionId: sleep.questionId },
          // Unanswered and left out: the hours slept and the text go
        ],
        scoreKind: QUESTIONNAIRE_SCORE.SUM,
      });

      expect(updated.questions.map((question) => question.label)).toEqual([
        'Tiredness',
        'Stress',
        'Soreness',
        'Sleep',
      ]);
      expect(updated.questions[0].questionId).toBe(fatigue.questionId);
      expect(updated.questions[1].questionId).not.toBe(stress.questionId);
      const archived = await prisma.questionnaireQuestion.findMany({
        where: {
          questionnaireId: created.questionnaireId,
          archivedAt: { not: null },
        },
        select: { questionId: true },
      });
      expect(archived.map((row) => row.questionId)).toEqual([
        stress.questionId,
      ]);
      // Left out and never answered: deleted
      expect(
        await prisma.questionnaireQuestion.count({
          where: { questionId: { in: [hours.questionId, text.questionId] } },
        }),
      ).toBe(0);

      // The coming occurrences take the new title
      const coming = await place(updated, ATHLETE_A, at(new Date(), 48));
      await library.update(coach, created.questionnaireId, {
        ...hooper,
        title: 'Renamed',
        questions: updated.questions.map((question) => ({
          ...question,
          questionId: question.questionId,
        })) as QuestionInput[],
        scoreKind: QUESTIONNAIRE_SCORE.SUM,
      });
      const names = await prisma.event.findMany({
        where: { eventId: { in: [placed.eventId, coming.eventId] } },
        select: { eventId: true, name: true },
        orderBy: { eventId: 'asc' },
      });
      expect(names.map((event) => event.name)).toEqual(['Hooper', 'Renamed']);
    });

    it('never deletes answers: archives instead', async () => {
      const created = await library.create(coach, hooper);
      const answered = await place(created, ATHLETE_A, at(MONDAY, -48));
      await responses.submit(
        athleteA,
        answered.eventId,
        { answers: answersOf(created, [3, 4, 2, 5]) },
        at(MONDAY, -47),
      );
      const coming = await place(created, ATHLETE_A, at(new Date(), 24));

      await expect(
        library.remove(coach, created.questionnaireId),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(await library.archive(coach, created.questionnaireId)).toEqual({
        removedOccurrences: 1,
      });
      expect(
        await prisma.event.findUnique({ where: { eventId: coming.eventId } }),
      ).toBeNull();
      expect(await library.list(coach)).toEqual([]);
      expect(await library.list(coach, { archived: true })).toHaveLength(1);
      expect(await prisma.questionnaireAnswer.count()).toBe(4);
    });

    it('deletes a questionnaire never answered, with its occurrences', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);
      await library.remove(coach, created.questionnaireId);
      expect(await prisma.questionnaire.count()).toBe(0);
      expect(
        await prisma.event.findUnique({ where: { eventId: placed.eventId } }),
      ).toBeNull();
    });
  });

  describe('placing in calendars', () => {
    it('places only the questionnaires the coach wrote', async () => {
      const created = await library.create(coach, hooper);
      await expect(
        place(created, ATHLETE_A, MONDAY, otherCoach),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lets the club read what was placed for its athlete', async () => {
      const created = await library.create(coach, hooper);
      const own = await place(created, ATHLETE_A);
      const forClub = await place(created, ATHLETE_B);
      const rows = await prisma.eventQuestionnaire.findMany({
        select: { eventId: true, clubId: true },
        orderBy: { eventId: 'asc' },
      });
      expect(rows).toEqual([
        { eventId: own.eventId, clubId: null },
        { eventId: forClub.eventId, clubId: 1 },
      ]);

      await expect(
        responses.getForEvent(clubCoach, forClub.eventId, MONDAY),
      ).resolves.toMatchObject({ canAnswer: false });
      // Another coach of the athlete does not read the author's questions
      await expect(
        responses.getForEvent(otherCoach, own.eventId, MONDAY),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('stops reading once the coach no longer coaches the athlete', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);
      await prisma.coachAthlete.deleteMany({
        where: { userId: COACH, athleteId: ATHLETE_A },
      });
      await expect(
        responses.getForEvent(coach, placed.eventId, MONDAY),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        responses.responses(coach, {
          from: at(MONDAY, -24),
          to: at(MONDAY, 24),
        }),
      ).resolves.toMatchObject({ occurrences: [] });
    });

    it('repeats every day, each occurrence closing as the next opens', async () => {
      const created = await library.create(coach, hooper);
      const first = await place(created, ATHLETE_A);
      await series.repeat(coach, first.eventId, {
        everyDays: 1,
        until: at(MONDAY, 24 * 6),
      });

      const read = await responses.getForEvent(
        athleteA,
        first.eventId,
        at(MONDAY, 1),
      );
      expect(read.occurrence.closesAt).toEqual(at(MONDAY, 24));
      expect(read.canAnswer).toBe(true);
      expect(
        await prisma.event.count({ where: { type: 'QUESTIONNAIRE' } }),
      ).toBe(7);
    });

    it('keeps answered occurrences when the coach deletes the series', async () => {
      const created = await library.create(coach, hooper);
      const first = await place(created, ATHLETE_A, at(MONDAY, -24));
      await series.repeat(coach, first.eventId, {
        everyDays: 1,
        until: at(MONDAY, 24 * 3),
      });
      const second = await prisma.event.findFirstOrThrow({
        where: { type: 'QUESTIONNAIRE', startDate: MONDAY },
      });
      await responses.submit(
        athleteA,
        second.eventId,
        { answers: answersOf(created, [3, 4, 2, 5]) },
        at(MONDAY, 1),
      );

      await expect(
        events.deleteEvent(coach, second.eventId),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await series.deleteFollowing(coach, first.eventId);
      const left = await prisma.event.findMany({
        where: { type: 'QUESTIONNAIRE' },
        select: { eventId: true },
      });
      expect(left).toEqual([{ eventId: second.eventId }]);
      // The athlete deletes their own answers
      await events.deleteEvent(athleteA, second.eventId);
      expect(await prisma.questionnaireAnswer.count()).toBe(0);
    });
  });

  describe('answering', () => {
    it('scores the answers and fills the metrics of the day', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);

      const answered = await responses.submit(
        athleteA,
        placed.eventId,
        { answers: answersOf(created, [3, 4, 2, 5, 7.46]) },
        at(MONDAY, 1),
      );

      expect(answered.occurrence).toMatchObject({
        status: QUESTIONNAIRE_STATUS.ANSWERED,
        score: 14,
        answeredAt: at(MONDAY, 1),
      });
      const metrics = await prisma.athleteMetric.findMany({
        where: { athleteId: ATHLETE_A },
        select: { type: true, value: true, date: true, source: true },
      });
      expect(metrics.sort((a, b) => a.type.localeCompare(b.type))).toEqual(
        [
          {
            type: 'SLEEP_DURATION',
            value: 7.5,
            date: new Date('2026-10-05T00:00:00Z'),
            source: null,
          },
          {
            type: 'HOOPER_INDEX',
            value: 14,
            date: new Date('2026-10-05T00:00:00Z'),
            source: null,
          },
        ].sort((a, b) => a.type.localeCompare(b.type)),
      );
      expect(notifyCalendar).toHaveBeenCalledWith(ATHLETE_A, {
        eventId: placed.eventId,
        reason: 'event_updated',
      });
    });

    it("leaves a device's value of the day alone", async () => {
      await prisma.athleteMetric.create({
        data: {
          athleteId: ATHLETE_A,
          type: 'SLEEP_DURATION',
          date: new Date('2026-10-05T00:00:00Z'),
          value: 6.9,
          source: 'GARMIN',
        },
      });
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);
      await responses.submit(
        athleteA,
        placed.eventId,
        { answers: answersOf(created, [3, 4, 2, 5, 8]) },
        at(MONDAY, 1),
      );
      const sleep = await prisma.athleteMetric.findFirstOrThrow({
        where: { athleteId: ATHLETE_A, type: 'SLEEP_DURATION' },
      });
      expect(sleep).toMatchObject({ value: 6.9, source: 'GARMIN' });
    });

    it('refuses invalid answers with the questions at fault', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);
      const error = await responses
        .submit(
          athleteA,
          placed.eventId,
          { answers: answersOf(created, [9, 4]) },
          at(MONDAY, 1),
        )
        .catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: 'INVALID_ANSWERS',
        errors: {
          [created.questions[0].questionId]: 'out_of_range',
          [created.questions[2].questionId]: 'required',
          [created.questions[3].questionId]: 'required',
        },
      });
      expect(await prisma.questionnaireAnswer.count()).toBe(0);
    });

    it('only lets the athlete answer, from the opening', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);
      const answers = { answers: answersOf(created, [3, 4, 2, 5]) };
      await expect(
        responses.submit(coach, placed.eventId, answers, at(MONDAY, 1)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        responses.submit(athleteA, placed.eventId, answers, at(MONDAY, -1)),
      ).rejects.toThrow('QUESTIONNAIRE_CLOSED');
    });

    it('takes late answers for a week, and changes for a day', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);
      const answers = (values: number[]) => ({
        answers: answersOf(created, values),
      });

      await responses.submit(
        athleteA,
        placed.eventId,
        answers([3, 4, 2, 5]),
        at(MONDAY, 24 * 6),
      );
      const changed = await responses.submit(
        athleteA,
        placed.eventId,
        answers([1, 1, 1, 1]),
        at(MONDAY, 24 * 6 + 23),
      );
      // The day to change starts at the first answer
      expect(changed.occurrence).toMatchObject({
        answeredAt: at(MONDAY, 24 * 6),
        score: 4,
      });
      await expect(
        responses.submit(
          athleteA,
          placed.eventId,
          answers([2, 2, 2, 2]),
          at(MONDAY, 24 * 7),
        ),
      ).rejects.toThrow('QUESTIONNAIRE_CLOSED');

      const missed = await place(created, ATHLETE_A, at(MONDAY, 24));
      await expect(
        responses.submit(
          athleteA,
          missed.eventId,
          answers([2, 2, 2, 2]),
          at(MONDAY, 24 * 8),
        ),
      ).rejects.toThrow('QUESTIONNAIRE_CLOSED');
    });

    it('lists what waits for the athlete', async () => {
      const created = await library.create(coach, hooper);
      const open = await place(created, ATHLETE_A);
      await place(created, ATHLETE_A, at(MONDAY, 48));
      await place(created, ATHLETE_B);

      expect(await responses.pending(athleteA, at(MONDAY, 1))).toEqual([
        {
          eventId: open.eventId,
          title: 'Hooper',
          startDate: MONDAY,
          closesAt: at(MONDAY, 24 * 7),
          questionCount: 6,
        },
      ]);
      expect(await responses.pending(coach, at(MONDAY, 1))).toEqual([]);
    });
  });

  describe('reading the answers', () => {
    it('keeps the replaced questions with the answers they got', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);
      await responses.submit(
        athleteA,
        placed.eventId,
        { answers: answersOf(created, [3, 4, 2, 5]) },
        at(MONDAY, 1),
      );
      await library.update(coach, created.questionnaireId, {
        ...hooper,
        scoreKind: QUESTIONNAIRE_SCORE.NONE,
        scoreMetricType: null,
        questions: [
          {
            type: QUESTION_TYPE.SCALE,
            questionId: created.questions[0].questionId,
            label: 'Fatigue',
            help: '',
            required: true,
            inScore: false,
            metricType: null,
            config: {
              min: 1,
              max: 10,
              step: 1,
              minLabel: '',
              maxLabel: '',
              display: 'BUTTONS',
            },
          },
        ],
      });

      const read = await responses.responses(coach, {
        athleteId: ATHLETE_A,
        from: at(MONDAY, -24),
        to: at(MONDAY, 24),
      });
      expect(read.athletes).toEqual([
        { athleteId: ATHLETE_A, firstName: 'Anna', lastName: 'A' },
      ]);
      expect(read.occurrences).toHaveLength(1);
      const questions = read.questionnaires[0].questions;
      // The four answered (one replaced), and the new scale
      expect(questions.filter((question) => question.archivedAt)).toHaveLength(
        4,
      );
      expect(questions.filter((question) => !question.archivedAt)).toHaveLength(
        1,
      );
    });

    it('reads one questionnaire across athletes', async () => {
      const created = await library.create(coach, hooper);
      await place(created, ATHLETE_A);
      await place(created, ATHLETE_B);
      const read = await responses.responses(coach, {
        questionnaireId: created.questionnaireId,
        from: at(MONDAY, -24),
        to: at(MONDAY, 24),
      });
      expect(
        read.occurrences.map((occurrence) => occurrence.athleteId),
      ).toEqual([ATHLETE_A, ATHLETE_B]);
      // The club coach only sees the club's athlete
      const club = await responses.responses(clubCoach, {
        questionnaireId: created.questionnaireId,
        from: at(MONDAY, -24),
        to: at(MONDAY, 24),
      });
      expect(
        club.occurrences.map((occurrence) => occurrence.athleteId),
      ).toEqual([ATHLETE_B]);
    });

    it('refuses a span longer than a year', async () => {
      await expect(
        responses.responses(coach, {
          from: MONDAY,
          to: at(MONDAY, 24 * 400),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('notifications', () => {
    it('tells the athlete once, by push and email, when it opens', async () => {
      const created = await library.create(coach, hooper);
      const placed = await place(created, ATHLETE_A);

      expect(await scheduler.notify(at(MONDAY, -1))).toEqual({
        requested: 0,
        reminded: 0,
      });
      expect(await scheduler.notify(at(MONDAY, 0.1))).toEqual({
        requested: 1,
        reminded: 0,
      });
      expect(await scheduler.notify(at(MONDAY, 0.2))).toEqual({
        requested: 0,
        reminded: 0,
      });
      expect(sendPush).toHaveBeenCalledTimes(1);
      expect(sendPush).toHaveBeenCalledWith({
        userId: 20,
        title: 'Questionnaire de Paula Coach',
        body: '« Hooper » vous attend.',
        data: { type: 'questionnaire', eventId: String(placed.eventId) },
      });
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail.mock.calls[0][0]).toMatchObject({
        to: 'a@example.com',
        subject: 'Paula Coach vous envoie « Hooper »',
      });
      expect(sendEmail.mock.calls[0][0].html).toContain(
        `https://app.example/dashboard/calendar?event=${placed.eventId}`,
      );
    });

    it('reminds a day later, and never once answered', async () => {
      const created = await library.create(coach, hooper);
      const weekly = await place(created, ATHLETE_A);
      const answered = await place(created, ATHLETE_B);
      await scheduler.notify(at(MONDAY, 0.1));
      await responses.submit(
        athleteB,
        answered.eventId,
        { answers: answersOf(created, [3, 4, 2, 5]) },
        at(MONDAY, 2),
      );
      sendPush.mockClear();

      expect(await scheduler.notify(at(MONDAY, 23))).toMatchObject({
        reminded: 0,
      });
      expect(await scheduler.notify(at(MONDAY, 24.1))).toMatchObject({
        reminded: 1,
      });
      expect(await scheduler.notify(at(MONDAY, 30))).toMatchObject({
        reminded: 0,
      });
      expect(sendPush).toHaveBeenCalledTimes(1);
      expect(sendPush.mock.calls[0][0]).toMatchObject({
        userId: 20,
        data: { eventId: String(weekly.eventId) },
      });
    });

    it('stays quiet about occurrences placed in the past', async () => {
      const created = await library.create(coach, hooper);
      await place(created, ATHLETE_A, at(MONDAY, -48));
      expect(await scheduler.notify(MONDAY)).toEqual({
        requested: 0,
        reminded: 0,
      });
    });

    it('stays quiet once the coach no longer coaches the athlete', async () => {
      const created = await library.create(coach, hooper);
      await place(created, ATHLETE_A);
      await prisma.coachAthlete.deleteMany({
        where: { userId: COACH, athleteId: ATHLETE_A },
      });
      await scheduler.notify(at(MONDAY, 0.1));
      expect(sendPush).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('emails only the athletes who want these emails', async () => {
      await prisma.user.update({
        where: { userId: 20 },
        data: { emailQuestionnaires: false },
      });
      const created = await library.create(coach, hooper);
      await place(created, ATHLETE_A);
      await scheduler.notify(at(MONDAY, 0.1));
      expect(sendPush).toHaveBeenCalledTimes(1);
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });
});
