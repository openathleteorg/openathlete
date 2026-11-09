import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import {
  LifecycleEmailKind,
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@openathlete/database';
import { ApiEnvSchemaType, EmailLanguage } from '@openathlete/shared';

import { maskEmail } from 'src/common/utils/mask-email';
import { validTimeZone, zonedClock } from 'src/common/utils/time-zone';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { providerName } from '../emails/core/format';
import { EmailFooter } from '../emails/core/layout';
import {
  LifecycleEmail,
  LifecycleEmailProps,
} from '../emails/templates/lifecycle/common';
import { buildConnectQuestionEmail } from '../emails/templates/lifecycle/connect-question.template';
import { buildConnectReminderEmail } from '../emails/templates/lifecycle/connect-reminder.template';
import { buildConnectionLostEmail } from '../emails/templates/lifecycle/connection-lost.template';
import { buildImportDoneEmail } from '../emails/templates/lifecycle/import-done.template';
import { buildMonthlyRecapEmail } from '../emails/templates/lifecycle/monthly-recap.template';
import { buildPlanNudgeEmail } from '../emails/templates/lifecycle/plan-nudge.template';
import { buildSupporterAskEmail } from '../emails/templates/lifecycle/supporter-ask.template';
import { buildSupporterCancelledEmail } from '../emails/templates/lifecycle/supporter-cancelled.template';
import { EmailTransportService } from '../services/email-transport.service';
import { LIST_OF_KIND, LIST_REASONS, WEBSITE_LOCALES } from './email-lists';
import {
  LifecycleState,
  NextEmail,
  nextLifecycleEmail,
} from './next-lifecycle-email';
import { createUnsubscribeToken } from './unsubscribe-token';

const DAY = 24 * 3_600_000;
const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.active,
  SubscriptionStatus.trialing,
];

const userSelect = {
  userId: true,
  email: true,
  firstName: true,
  language: true,
  timeZone: true,
  createdAt: true,
  emailTips: true,
  emailRecap: true,
  emailNewsConsentAt: true,
  athlete: {
    select: {
      athleteId: true,
      providerAccounts: {
        select: {
          providerAccountId: true,
          provider: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          fullImportCompletedAt: true,
          disconnectedByUser: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  },
  subscription: {
    select: {
      subscriptionId: true,
      plan: true,
      status: true,
      cancelAtPeriodEnd: true,
      updatedAt: true,
    },
  },
  lifecycleEmails: { select: { kind: true, ref: true, sentAt: true } },
} satisfies Prisma.UserSelect;

type Candidate = Prisma.UserGetPayload<{ select: typeof userSelect }> & {
  athlete: NonNullable<
    Prisma.UserGetPayload<{ select: typeof userSelect }>['athlete']
  >;
};

/** First day of the UTC month `offset` months from the one of `date` */
function monthStart(date: Date, offset = 0) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1),
  );
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

/**
 * Sends the onboarding, recap and news emails, each when the user's
 * situation calls for it (see nextLifecycleEmail). Off unless the instance
 * sends email and EMAIL_SIGNATURE names who writes them.
 */
@Injectable()
export class LifecycleEmailScheduler {
  private readonly logger = new Logger(LifecycleEmailScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transport: EmailTransportService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  @Cron('17 * * * *')
  async sendLifecycleEmails(now = new Date()): Promise<number> {
    const signature = this.config.get('EMAIL_SIGNATURE');
    if (!signature || !this.transport.isEnabled()) return 0;

    // Onboarded accounts only: robots that sign up never finish onboarding
    const users = (await this.prisma.user.findMany({
      where: { onboardingCompleted: true, athlete: { isNot: null } },
      select: userSelect,
    })) as Candidate[];
    if (users.length === 0) return 0;

    const facts = await this.loadFacts(
      users.map((user) => user.athlete.athleteId),
      now,
    );
    const billingEnabled = Boolean(this.config.get('STRIPE_SECRET_KEY'));

    let sent = 0;
    for (const user of users) {
      const next = nextLifecycleEmail(
        this.stateOf(user, facts, now, billingEnabled),
      );
      if (!next) continue;
      if (await this.send(user, next, signature, now)) sent++;
    }
    if (sent > 0) this.logger.log(`Sent ${sent} lifecycle emails`);
    return sent;
  }

  private async loadFacts(athleteIds: number[], now: Date) {
    const athleteId = { in: athleteIds };
    const previousMonth = monthStart(now, -1);
    const [activities, planned, races, lastMonth] = await Promise.all([
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: { athleteId, type: 'ACTIVITY' },
        _count: { _all: true },
      }),
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: { athleteId, type: 'TRAINING' },
        _count: { _all: true },
      }),
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: { athleteId, type: 'COMPETITION', startDate: { gt: now } },
        _count: { _all: true },
      }),
      this.prisma.event.groupBy({
        by: ['athleteId'],
        where: {
          athleteId,
          type: 'ACTIVITY',
          startDate: { gte: previousMonth, lt: monthStart(now) },
        },
        _count: { _all: true },
      }),
    ]);
    const byAthlete = (
      rows: { athleteId: number | null; _count: { _all: number } }[],
    ) => new Map(rows.map((row) => [row.athleteId, row._count._all]));
    return {
      activities: byAthlete(activities),
      planned: byAthlete(planned),
      races: byAthlete(races),
      lastMonth: byAthlete(lastMonth),
      previousMonth: monthKey(previousMonth),
    };
  }

  private stateOf(
    user: Candidate,
    facts: Awaited<ReturnType<LifecycleEmailScheduler['loadFacts']>>,
    now: Date,
    billingEnabled: boolean,
  ): LifecycleState {
    const { date, hour } = zonedClock(now, validTimeZone(user.timeZone));
    const athleteId = user.athlete.athleteId;
    const subscription = user.subscription;
    const supporter = subscription?.plan === SubscriptionPlan.SUPPORTER;
    const isSupporter =
      supporter &&
      ACTIVE_STATUSES.includes(subscription.status) &&
      !subscription.cancelAtPeriodEnd;
    const cancelled =
      supporter &&
      (subscription.cancelAtPeriodEnd ||
        subscription.status === SubscriptionStatus.canceled);

    return {
      now,
      localHour: hour,
      localDay: Number(date.slice(8, 10)),
      createdAt: user.createdAt,
      emailTips: user.emailTips,
      emailRecap: user.emailRecap,
      newsConsent: user.emailNewsConsentAt !== null,
      billingEnabled,
      isSupporter,
      providers: user.athlete.providerAccounts,
      activityCount: facts.activities.get(athleteId) ?? 0,
      plannedCount: facts.planned.get(athleteId) ?? 0,
      hasUpcomingRace: (facts.races.get(athleteId) ?? 0) > 0,
      previousMonthActivityCount: facts.lastMonth.get(athleteId) ?? 0,
      previousMonth: facts.previousMonth,
      cancellation: cancelled
        ? {
            subscriptionId: subscription.subscriptionId,
            at: subscription.updatedAt,
          }
        : null,
      sent: user.lifecycleEmails,
    };
  }

  /** Claims the email, then sends it; gives the claim back if sending fails */
  private async send(
    user: Candidate,
    next: NextEmail,
    signature: string,
    now: Date,
  ): Promise<boolean> {
    // The API and the worker both run this job: the unique row decides
    const claim = await this.prisma.lifecycleEmail
      .create({
        data: {
          userId: user.userId,
          kind: next.kind,
          ref: next.ref,
          sentAt: now,
        },
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
    if (!claim) return false;

    try {
      const language = user.language as EmailLanguage;
      const email = await this.build(user, next, language, signature, now);
      const list = LIST_OF_KIND[next.kind];
      const token = list
        ? createUnsubscribeToken(
            this.config.get('JWT_SECRET_KEY'),
            user.userId,
            list,
          )
        : null;
      await this.transport.send({
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        senderName: this.senderName(signature),
        headers: token
          ? {
              'List-Unsubscribe': `<${this.apiUrl()}/emails/unsubscribe?token=${token}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            }
          : undefined,
      });
      return true;
    } catch (error) {
      await this.prisma.lifecycleEmail.delete({
        where: { lifecycleEmailId: claim.lifecycleEmailId },
      });
      this.logger.error(
        `Could not send ${next.kind} to ${maskEmail(user.email)}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async build(
    user: Candidate,
    next: NextEmail,
    language: EmailLanguage,
    signature: string,
    now: Date,
  ): Promise<LifecycleEmail> {
    const appUrl = this.config.get('APP_URL').replace(/\/$/, '');
    const list = LIST_OF_KIND[next.kind];
    const footer: EmailFooter = list
      ? {
          kind: 'list',
          reason: LIST_REASONS[list][language],
          unsubscribeUrl: `${appUrl}/emails/unsubscribe?token=${createUnsubscribeToken(this.config.get('JWT_SECRET_KEY'), user.userId, list)}`,
          preferencesUrl: `${appUrl}/dashboard/settings?tab=profile`,
        }
      : { kind: 'account' };
    const base: LifecycleEmailProps = {
      language,
      name: user.firstName || undefined,
      signature,
      footer,
    };
    const athleteId = user.athlete.athleteId;
    const connectionsUrl = `${appUrl}/dashboard/settings?tab=connectors`;
    const calendarUrl = `${appUrl}/dashboard/calendar`;

    switch (next.kind) {
      case LifecycleEmailKind.CONNECT_REMINDER:
        return buildConnectReminderEmail({ ...base, connectionsUrl });

      case LifecycleEmailKind.CONNECT_QUESTION:
        return buildConnectQuestionEmail(base);

      case LifecycleEmailKind.IMPORT_DONE: {
        const provider = user.athlete.providerAccounts.find(
          (p) => p.status === 'active',
        );
        const [first, total, weeks, nextRace] = await Promise.all([
          this.prisma.event.findFirst({
            where: { athleteId, type: 'ACTIVITY' },
            orderBy: { startDate: 'asc' },
            select: { startDate: true },
          }),
          this.prisma.event.count({ where: { athleteId, type: 'ACTIVITY' } }),
          this.activityTotals(
            athleteId,
            new Date(now.getTime() - 28 * DAY),
            now,
          ),
          this.nextRace(athleteId, now),
        ]);
        return buildImportDoneEmail({
          ...base,
          provider: providerName(provider?.provider ?? ''),
          total,
          firstActivityAt: first?.startDate ?? now,
          lastFourWeeks: weeks,
          nextRace,
          calendarUrl,
        });
      }

      case LifecycleEmailKind.PLAN_NUDGE:
        return buildPlanNudgeEmail({
          ...base,
          calendarUrl,
          plansUrl: `https://openathlete.org/${WEBSITE_LOCALES[language]}/training-plans`,
        });

      case LifecycleEmailKind.CONNECTION_LOST: {
        const account = user.athlete.providerAccounts.find(
          (p) => String(p.providerAccountId) === next.ref,
        );
        return buildConnectionLostEmail({
          ...base,
          provider: providerName(account?.provider ?? ''),
          since: account?.updatedAt ?? now,
          connectionsUrl,
        });
      }

      case LifecycleEmailKind.MONTHLY_RECAP: {
        const start = new Date(`${next.ref}-01T00:00:00Z`);
        const end = monthStart(start, 1);
        const before = monthStart(start, -1);
        const [month, previous, longest, nextRace] = await Promise.all([
          this.activityTotals(athleteId, start, end),
          this.activityTotals(athleteId, before, start),
          this.prisma.eventActivity.findFirst({
            where: { event: { athleteId, startDate: { gte: start, lt: end } } },
            orderBy: { distance: 'desc' },
            select: { distance: true, event: { select: { name: true } } },
          }),
          this.nextRace(athleteId, now),
        ]);
        return buildMonthlyRecapEmail({
          ...base,
          month: next.ref,
          previousMonth: monthKey(before),
          ...month,
          previousDistance: previous.distance,
          longest: longest
            ? { name: longest.event.name, distance: longest.distance }
            : null,
          nextRace,
          statisticsUrl: `${appUrl}/dashboard/statistics`,
        });
      }

      case LifecycleEmailKind.SUPPORTER_ASK: {
        const firstConnection =
          user.athlete.providerAccounts[0]?.createdAt ?? now;
        const [activityCount, supporters] = await Promise.all([
          this.prisma.event.count({
            where: {
              athleteId,
              type: 'ACTIVITY',
              startDate: { gte: firstConnection },
            },
          }),
          this.prisma.subscription.count({
            where: {
              plan: SubscriptionPlan.SUPPORTER,
              status: { in: ACTIVE_STATUSES },
            },
          }),
        ]);
        return buildSupporterAskEmail({
          ...base,
          weeks: Math.floor(
            (now.getTime() - firstConnection.getTime()) / (7 * DAY),
          ),
          activityCount,
          supporters,
          subscriptionUrl: `${appUrl}/dashboard/settings?tab=subscription`,
        });
      }

      case LifecycleEmailKind.SUPPORTER_CANCELLED:
        return buildSupporterCancelledEmail(base);
    }
  }

  private async activityTotals(athleteId: number, from: Date, to: Date) {
    const totals = await this.prisma.eventActivity.aggregate({
      where: { event: { athleteId, startDate: { gte: from, lt: to } } },
      _count: { _all: true },
      _sum: { distance: true, movingTime: true, elevationGain: true },
    });
    return {
      count: totals._count._all,
      distance: totals._sum.distance ?? 0,
      movingTime: totals._sum.movingTime ?? 0,
      elevationGain: totals._sum.elevationGain ?? 0,
    };
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

  /** The person who signs, then the instance's sender name */
  private senderName(signature: string) {
    const instance = this.config.get('EMAIL_FROM_NAME') || 'OpenAthlete';
    return instance.includes(signature)
      ? instance
      : `${signature} · ${instance}`;
  }

  private apiUrl() {
    return (
      this.config.get('API_PUBLIC_URL') ?? `${this.config.get('APP_URL')}/api`
    ).replace(/\/$/, '');
  }
}
