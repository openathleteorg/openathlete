import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  LifecycleEmailKind,
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@openathlete/database';
import {
  ApiEnvSchemaType,
  EmailLanguage,
  SUPPORTER_GOAL,
} from '@openathlete/shared';

import { maskEmail } from 'src/common/utils/mask-email';
import { validTimeZone, zonedClock } from 'src/common/utils/time-zone';
import {
  AnalyticsService,
  stableUuid,
} from 'src/modules/analytics/analytics.service';
import {
  addUtcDays,
  advanceFitness,
  startOfUtcDay,
  toUtcDateKey,
} from 'src/modules/core/helpers/training-load';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { buildCoachWeeklyEmail } from '../emails/templates/lifecycle/coach-weekly.template';
import {
  WeeklyTotals,
  buildWeeklyRecapEmail,
} from '../emails/templates/lifecycle/weekly-recap.template';
import { campaignLink } from '../lifecycle/campaign-link';
import {
  ListEmailConfig,
  listFooter,
  signedSenderName,
  unsubscribeHeaders,
} from '../lifecycle/list-email';
import { EmailTransportService } from '../services/email-transport.service';
import {
  Range,
  dueMonday,
  isStillTraining,
  showsSupporterBar,
  weeksAround,
} from './weekly-window';

const DAY = 24 * 3_600_000;
const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.active,
  SubscriptionStatus.trialing,
];
const KIND = LifecycleEmailKind.WEEKLY_RECAP;
const COACH_KIND = LifecycleEmailKind.COACH_WEEKLY;
/** A week's TRIMP this much above the 4 weeks before is a sharp rise */
const LOAD_RISE_RATIO = 0.3;
/** ...and by at least this much, so that small loads don't count */
const LOAD_RISE_MIN = 50;

export interface WeeklyEmailJob {
  /** The athlete's recap, or the coach's athletes to look at */
  kind: 'athlete' | 'coach';
  userId: number;
  /** The local Monday of the email, YYYY-MM-DD */
  monday: string;
}

/**
 * The Monday emails. To athletes: the past week in figures, the form, the
 * week to come. To coaches: the athletes to look at. Off unless the instance sends email and EMAIL_SIGNATURE names who writes.
 * The scheduler finds who is due; a queue spreads the sending.
 */
@Injectable()
export class WeeklyEmailService {
  private readonly logger = new Logger(WeeklyEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transport: EmailTransportService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  isEnabled(): boolean {
    return (
      Boolean(this.config.get('EMAIL_SIGNATURE')) && this.transport.isEnabled()
    );
  }

  /** Whose email is due at `now`: Monday morning, their time, and training */
  async dueRecipients(now: Date): Promise<WeeklyEmailJob[]> {
    if (!this.isEnabled()) return [];

    // Onboarded accounts only: robots that sign up never finish onboarding
    const users = await this.prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        emailWeekly: true,
        athlete: { isNot: null },
      },
      select: {
        userId: true,
        timeZone: true,
        athlete: { select: { athleteId: true } },
        lifecycleEmails: {
          where: {
            kind: KIND,
            sentAt: { gt: new Date(now.getTime() - 7 * DAY) },
          },
          select: { ref: true },
        },
      },
    });
    const due = users.flatMap((user) => {
      const monday = dueMonday(now, validTimeZone(user.timeZone));
      if (!monday || !user.athlete) return [];
      if (user.lifecycleEmails.some((email) => email.ref === monday)) return [];
      return [
        {
          kind: 'athlete' as const,
          userId: user.userId,
          athleteId: user.athlete.athleteId,
          monday,
        },
      ];
    });
    if (due.length === 0) return [];

    const athleteId = { in: due.map((user) => user.athleteId) };
    const since = new Date(now.getTime() - 21 * DAY);
    const [activities, planned] = await Promise.all([
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: { athleteId, type: 'ACTIVITY', startDate: { gte: since } },
        _max: { startDate: true },
      }),
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: {
          athleteId,
          type: { in: ['TRAINING', 'COMPETITION'] },
          startDate: { gte: since, lt: new Date(now.getTime() + 7 * DAY) },
        },
        _max: { startDate: true },
      }),
    ]);
    const latest = (rows: typeof activities) =>
      new Map(rows.map((row) => [row.athleteId, row._max.startDate]));
    const lastActivity = latest(activities);
    const lastPlanned = latest(planned);

    return due
      .filter((user) =>
        isStillTraining(
          now,
          lastActivity.get(user.athleteId) ?? null,
          lastPlanned.get(user.athleteId) ?? null,
        ),
      )
      .map(({ kind, userId, monday }) => ({ kind, userId, monday }));
  }

  /**
   * Coaches with at least one athlete, on Monday morning their time. Whether
   * there is anything to tell them is known when sending.
   */
  async dueCoaches(now: Date): Promise<WeeklyEmailJob[]> {
    if (!this.isEnabled()) return [];
    const coaches = await this.prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        emailCoachWeekly: true,
        coachAthletes: { some: {} },
      },
      select: {
        userId: true,
        timeZone: true,
        lifecycleEmails: {
          where: {
            kind: COACH_KIND,
            sentAt: { gt: new Date(now.getTime() - 7 * DAY) },
          },
          select: { ref: true },
        },
      },
    });
    return coaches.flatMap((coach) => {
      const monday = dueMonday(now, validTimeZone(coach.timeZone));
      if (!monday) return [];
      if (coach.lifecycleEmails.some((email) => email.ref === monday))
        return [];
      return [{ kind: 'coach' as const, userId: coach.userId, monday }];
    });
  }

  /** Sends the email of a queued job */
  async sendJob(job: WeeklyEmailJob, now: Date): Promise<boolean> {
    return job.kind === 'coach'
      ? this.sendCoach(job, now)
      : this.send(job, now);
  }

  /**
   * Claims the week's email, then sends it; gives the claim back and throws
   * when sending fails, so the job tries again.
   * @returns whether this call sent it
   */
  async send(
    { userId, monday }: Pick<WeeklyEmailJob, 'userId' | 'monday'>,
    now: Date,
  ): Promise<boolean> {
    const signature = this.config.get('EMAIL_SIGNATURE');
    if (!signature || !this.transport.isEnabled()) return false;

    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        language: true,
        timeZone: true,
        emailWeekly: true,
        emailNewsConsentAt: true,
        athlete: { select: { athleteId: true } },
        subscription: {
          select: { plan: true, status: true, cancelAtPeriodEnd: true },
        },
      },
    });
    // Turned off, or the account deleted, since the job was queued
    if (!user?.athlete || !user.emailWeekly) return false;

    const claim = await this.claim(userId, KIND, monday, now);
    if (!claim) return false;

    try {
      const language = user.language as EmailLanguage;
      const timeZone = validTimeZone(user.timeZone);
      const athleteId = user.athlete.athleteId;
      const weeks = weeksAround(monday, timeZone);
      const subscription = user.subscription;
      const isSupporter =
        subscription?.plan === SubscriptionPlan.SUPPORTER &&
        ACTIVE_STATUSES.includes(subscription.status) &&
        !subscription.cancelAtPeriodEnd;
      // A commercial line: only to those who asked for news (CNIL)
      const supporterBar =
        Boolean(this.config.get('STRIPE_SECRET_KEY')) &&
        user.emailNewsConsentAt !== null &&
        !isSupporter &&
        showsSupporterBar(monday, userId);

      const [past, previous, sessions, upcoming, form, nextRace, garmin] =
        await Promise.all([
          this.totals(athleteId, weeks.past),
          this.totals(athleteId, weeks.previous),
          this.plannedSessions(athleteId, weeks.past),
          this.plannedSessions(athleteId, weeks.next),
          this.form(athleteId, monday),
          this.nextRace(athleteId, now),
          this.hasGarminData(athleteId),
        ]);
      const supporters = supporterBar
        ? await this.prisma.subscription.count({
            where: {
              plan: SubscriptionPlan.SUPPORTER,
              status: { in: ACTIVE_STATUSES },
            },
          })
        : null;

      const config = this.listConfig();
      const link = (url: string) => campaignLink(url, KIND);
      const email = buildWeeklyRecapEmail({
        language,
        name: user.firstName || undefined,
        signature,
        footer: listFooter(config, userId, 'weekly', language),
        past: {
          ...past,
          planned: sessions.length,
          done: sessions.filter((session) => session.done).length,
        },
        previous,
        form,
        upcoming: upcoming.map((session) => ({
          date: zonedClock(session.startDate, timeZone).date,
          name: session.name,
          duration: session.duration,
        })),
        nextRace,
        calendarUrl: link(`${config.appUrl}/dashboard/calendar`),
        garmin,
        supporters:
          supporters === null
            ? null
            : {
                count: supporters,
                goal: SUPPORTER_GOAL,
                url: link(
                  `${config.appUrl}/dashboard/settings?tab=subscription`,
                ),
              },
      });

      await this.transport.send({
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        kind: 'weekly_recap',
        idempotencyKey: `openathlete-lifecycle-${claim.lifecycleEmailId}`,
        senderName: signedSenderName(
          signature,
          this.config.get('EMAIL_FROM_NAME'),
        ),
        headers: unsubscribeHeaders(config, userId, 'weekly'),
      });
      await this.analytics?.capture(
        userId,
        'weekly_email_sent',
        {
          planned: upcoming.length > 0,
          supporter: isSupporter,
          supporter_bar: supporters !== null,
          language,
        },
        { uuid: stableUuid(`lifecycle_email:${claim.lifecycleEmailId}`) },
      );
      return true;
    } catch (error) {
      await this.prisma.lifecycleEmail.delete({
        where: { lifecycleEmailId: claim.lifecycleEmailId },
      });
      this.logger.error(
        `Could not send the weekly email to ${maskEmail(user.email)}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Sends a coach the athletes to look at after the past week: sessions
   * missed, load sharply up, questionnaires answered. Nothing to tell, no
   * email. Gives the claim back and throws when sending fails.
   */
  async sendCoach(
    { userId, monday }: Pick<WeeklyEmailJob, 'userId' | 'monday'>,
    now: Date,
  ): Promise<boolean> {
    const signature = this.config.get('EMAIL_SIGNATURE');
    if (!signature || !this.transport.isEnabled()) return false;

    const coach = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        email: true,
        firstName: true,
        language: true,
        timeZone: true,
        emailCoachWeekly: true,
        coachAthletes: {
          select: {
            athlete: {
              select: {
                athleteId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!coach?.emailCoachWeekly) return false;

    const weeks = weeksAround(monday, validTimeZone(coach.timeZone));
    // Club and personal links can both tie the coach to an athlete
    const athletes = [
      ...new Map(
        coach.coachAthletes.map(({ athlete }) => [athlete.athleteId, athlete]),
      ).values(),
    ];
    const signals = await this.coachSignals(
      userId,
      athletes.map((athlete) => athlete.athleteId),
      weeks.past,
    );
    const config = this.listConfig();
    const link = (url: string) => campaignLink(url, COACH_KIND);
    const flagged = athletes
      .map((athlete) => {
        const signal = signals.get(athlete.athleteId)!;
        const name =
          [athlete.user?.firstName, athlete.user?.lastName]
            .filter(Boolean)
            .join(' ') || `#${athlete.athleteId}`;
        return {
          name,
          ...signal,
          calendarUrl: link(
            `${config.appUrl}/dashboard/calendar/${athlete.athleteId}`,
          ),
          athleteId: athlete.athleteId,
          count:
            (signal.missed > 0 ? 1 : 0) +
            (signal.loadRise !== null ? 1 : 0) +
            (signal.answers > 0 ? 1 : 0),
        };
      })
      .filter((athlete) => athlete.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    // A quiet week asks nothing of the coach: no email
    if (flagged.length === 0) return false;

    const claim = await this.claim(userId, COACH_KIND, monday, now);
    if (!claim) return false;
    try {
      const language = coach.language as EmailLanguage;
      const garmin = await this.anyGarminData(
        flagged
          .filter((athlete) => athlete.loadRise !== null)
          .map((athlete) => athlete.athleteId),
      );
      const email = buildCoachWeeklyEmail({
        language,
        name: coach.firstName || undefined,
        signature,
        footer: listFooter(config, userId, 'coach_weekly', language),
        athletes: flagged,
        dashboardUrl: link(`${config.appUrl}/dashboard/coach`),
        garmin,
      });
      await this.transport.send({
        to: coach.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        kind: 'coach_weekly',
        idempotencyKey: `openathlete-lifecycle-${claim.lifecycleEmailId}`,
        senderName: signedSenderName(
          signature,
          this.config.get('EMAIL_FROM_NAME'),
        ),
        headers: unsubscribeHeaders(config, userId, 'coach_weekly'),
      });
      await this.analytics?.capture(
        userId,
        'coach_weekly_email_sent',
        { athletes: flagged.length, language },
        { uuid: stableUuid(`lifecycle_email:${claim.lifecycleEmailId}`) },
      );
      return true;
    } catch (error) {
      await this.prisma.lifecycleEmail.delete({
        where: { lifecycleEmailId: claim.lifecycleEmailId },
      });
      this.logger.error(
        `Could not send the coach weekly email to ${maskEmail(coach.email)}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /** Per athlete: sessions missed, sharp rise of load, answers to the coach */
  private async coachSignals(
    coachUserId: number,
    athleteIds: number[],
    past: Range,
  ) {
    const athleteId = { in: athleteIds };
    // The four weeks before the past one, as the baseline of its load
    const baselineFrom = new Date(past.from.getTime() - 28 * DAY);
    const trimpBetween = async (from: Date, to: Date) => {
      const entries = await this.prisma.trainingLoadEntry.findMany({
        where: {
          calculation: { type: 'TRIMP' },
          activity: { event: { athleteId, startDate: { gte: from, lt: to } } },
        },
        select: {
          value: true,
          activity: { select: { event: { select: { athleteId: true } } } },
        },
      });
      const byAthlete = new Map<number, number>();
      for (const entry of entries) {
        const id = entry.activity.event.athleteId;
        if (id !== null)
          byAthlete.set(id, (byAthlete.get(id) ?? 0) + entry.value);
      }
      return byAthlete;
    };
    const [missed, week, baseline, answers] = await Promise.all([
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: {
          athleteId,
          type: 'TRAINING',
          startDate: { gte: past.from, lt: past.to },
          training: { relatedActivityId: null },
        },
        _count: { _all: true },
      }),
      trimpBetween(past.from, past.to),
      trimpBetween(baselineFrom, past.from),
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: {
          athleteId,
          questionnaire: {
            questionnaire: { coachUserId },
            answeredAt: { gte: past.from, lt: past.to },
          },
        },
        _count: { _all: true },
      }),
    ]);
    return new Map(
      athleteIds.map((id) => {
        const load = week.get(id) ?? 0;
        const usual = (baseline.get(id) ?? 0) / 4;
        return [
          id,
          {
            missed:
              missed.find((row) => row.athleteId === id)?._count._all ?? 0,
            loadRise: sharpLoadRise(load, usual),
            answers:
              answers.find((row) => row.athleteId === id)?._count._all ?? 0,
          },
        ];
      }),
    );
  }

  /** The API and the worker can both send: the unique row decides */
  private claim(
    userId: number,
    kind: LifecycleEmailKind,
    monday: string,
    now: Date,
  ) {
    return this.prisma.lifecycleEmail
      .create({
        data: { userId, kind, ref: monday, sentAt: now },
        select: { lifecycleEmailId: true },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return null;
        }
        throw error;
      });
  }

  private async totals(athleteId: number, range: Range): Promise<WeeklyTotals> {
    const inRange = { athleteId, startDate: { gte: range.from, lt: range.to } };
    const [totals, load] = await Promise.all([
      this.prisma.eventActivity.aggregate({
        where: { event: inRange },
        _count: { _all: true },
        _sum: { distance: true, movingTime: true, elevationGain: true },
      }),
      this.prisma.trainingLoadEntry.aggregate({
        where: {
          calculation: { athleteId, type: 'TRIMP' },
          activity: { event: inRange },
        },
        _sum: { value: true },
      }),
    ]);
    return {
      count: totals._count._all,
      distance: totals._sum.distance ?? 0,
      movingTime: totals._sum.movingTime ?? 0,
      elevationGain: totals._sum.elevationGain ?? 0,
      trimp: Math.round(load._sum.value ?? 0),
    };
  }

  /** Trainings and races of the range, done when an activity is linked */
  private async plannedSessions(athleteId: number, range: Range) {
    const goal = { select: { goalDuration: true, relatedActivityId: true } };
    const events = await this.prisma.event.findMany({
      where: {
        athleteId,
        type: { in: ['TRAINING', 'COMPETITION'] },
        startDate: { gte: range.from, lt: range.to },
      },
      orderBy: { startDate: 'asc' },
      select: {
        name: true,
        startDate: true,
        training: goal,
        competition: goal,
      },
    });
    return events.map((event) => {
      const session = event.training ?? event.competition;
      return {
        name: event.name,
        startDate: event.startDate,
        duration: session?.goalDuration ?? null,
        done: session?.relatedActivityId != null,
      };
    });
  }

  /**
   * Fitness and fatigue at the end of the past week (its last UTC day, as
   * the app buckets load), and fatigue a week earlier for the trend.
   */
  private async form(athleteId: number, monday: string) {
    const entries = await this.prisma.trainingLoadEntry.findMany({
      where: {
        calculation: { athleteId, type: 'TRIMP' },
        date: { lt: new Date(`${monday}T00:00:00Z`) },
      },
      select: { date: true, value: true },
      orderBy: { date: 'asc' },
    });
    if (entries.length === 0) return null;

    const daily = new Map<string, number>();
    for (const entry of entries) {
      const key = toUtcDateKey(entry.date);
      daily.set(key, (daily.get(key) ?? 0) + entry.value);
    }
    const last = addUtcDays(new Date(`${monday}T00:00:00Z`), -1);
    const weekBefore = toUtcDateKey(addUtcDays(last, -7));
    let fitness = { ctl: 0, atl: 0 };
    let atlWeekBefore = 0;
    // Every day counts, rest days included: they make fitness decay
    for (
      let day = startOfUtcDay(entries[0].date);
      day <= last;
      day = addUtcDays(day, 1)
    ) {
      fitness = advanceFitness(fitness, daily.get(toUtcDateKey(day)) ?? 0);
      if (toUtcDateKey(day) === weekBefore) atlWeekBefore = fitness.atl;
    }
    return { ctl: fitness.ctl, atl: fitness.atl, atlWeekBefore };
  }

  private async nextRace(athleteId: number, now: Date) {
    const race = await this.prisma.event.findFirst({
      where: { athleteId, type: 'COMPETITION', startDate: { gt: now } },
      orderBy: { startDate: 'asc' },
      select: { name: true, startDate: true },
    });
    if (!race) return null;
    return {
      name: race.name,
      daysLeft: Math.max(
        1,
        Math.ceil((race.startDate.getTime() - now.getTime()) / DAY),
      ),
    };
  }

  /** Same rule as the app's attribution (AthleteService.getGarminDataAthleteIds) */
  private hasGarminData(athleteId: number) {
    return this.anyGarminData([athleteId]);
  }

  private async anyGarminData(athleteIds: number[]) {
    if (athleteIds.length === 0) return false;
    const found = await this.prisma.athlete.count({
      where: {
        athleteId: { in: athleteIds },
        OR: [
          { events: { some: { activity: { provider: 'GARMIN' } } } },
          { metrics: { some: { source: 'GARMIN' } } },
        ],
      },
    });
    return found > 0;
  }

  private listConfig(): ListEmailConfig {
    const appUrl = this.config.get('APP_URL').replace(/\/$/, '');
    return {
      secret: this.config.get('JWT_SECRET_KEY'),
      appUrl,
      apiUrl: (this.config.get('API_PUBLIC_URL') ?? `${appUrl}/api`).replace(
        /\/$/,
        '',
      ),
    };
  }
}

/**
 * The rise of a week's load over the usual weekly load, when sharp enough to
 * flag to a coach; null otherwise, or without a usual load to compare with.
 */
export function sharpLoadRise(load: number, usual: number): number | null {
  if (usual <= 0) return null;
  const rise = load / usual - 1;
  return rise >= LOAD_RISE_RATIO && load - usual >= LOAD_RISE_MIN ? rise : null;
}
