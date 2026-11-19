import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { Prisma } from '@openathlete/database';
import {
  type ApiEnvSchemaType,
  type EmailLanguage,
  isTimeZone,
} from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { maskEmail } from 'src/common/utils/mask-email';
import { buildQuestionnaireRequestEmail } from 'src/modules/notification/emails/templates/questionnaire-request.template';
import { LIST_REASONS } from 'src/modules/notification/lifecycle/email-lists';
import { createUnsubscribeToken } from 'src/modules/notification/lifecycle/unsubscribe-token';
import { questionnaireNotification } from 'src/modules/notification/push/questionnaire';
import { EmailTransportService } from 'src/modules/notification/services/email-transport.service';
import { PushNotificationService } from 'src/modules/notification/services/push-notification.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { closingDates } from './questionnaire-closing';

const HOUR_MS = 3600 * 1000;
/** An occurrence placed in the past is no news past a day */
const REQUEST_WINDOW_MS = 24 * HOUR_MS;
/** None stays open longer than its week */
const OPEN_WINDOW_MS = 7 * 24 * HOUR_MS;
/** The reminder comes a day after, or halfway for those open a shorter time */
const REMINDER_DELAY_MS = 24 * HOUR_MS;

const CANDIDATE_SELECT = {
  eventQuestionnaireId: true,
  event: {
    select: {
      eventId: true,
      name: true,
      seriesId: true,
      startDate: true,
      athleteId: true,
      athlete: {
        select: {
          user: {
            select: {
              userId: true,
              email: true,
              firstName: true,
              language: true,
              timeZone: true,
              emailQuestionnaires: true,
            },
          },
        },
      },
    },
  },
  questionnaire: {
    select: {
      coachUserId: true,
      coach: { select: { firstName: true, lastName: true } },
      _count: { select: { questions: { where: { archivedAt: null } } } },
    },
  },
} satisfies Prisma.EventQuestionnaireSelect;

type Candidate = Prisma.EventQuestionnaireGetPayload<{
  select: typeof CANDIDATE_SELECT;
}>;

/** Where the reminder of an occurrence falls, once it closes at `closesAt` */
export function reminderTime(startDate: Date, closesAt: Date): Date {
  const halfway = (closesAt.getTime() - startDate.getTime()) / 2;
  return new Date(startDate.getTime() + Math.min(REMINDER_DELAY_MS, halfway));
}

/**
 * Tells athletes, by push and email, when a questionnaire from their coach
 * opens, and reminds them once if it is still unanswered. The API and the
 * worker both run this job: each message is claimed before it goes out.
 */
@Injectable()
export class QuestionnaireNotificationScheduler {
  private readonly logger = new Logger(QuestionnaireNotificationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
    private readonly push: PushNotificationService,
    private readonly email: EmailTransportService,
  ) {}

  @Cron('*/10 * * * *')
  async notify(now = new Date()) {
    const requested = await this.sendRequests(now);
    const reminded = await this.sendReminders(now);
    if (requested + reminded > 0) {
      this.logger.log(
        `Questionnaires: ${requested} opened, ${reminded} reminded`,
      );
    }
    return { requested, reminded };
  }

  private async sendRequests(now: Date): Promise<number> {
    const candidates = await this.prisma.eventQuestionnaire.findMany({
      where: {
        notifiedAt: null,
        answeredAt: null,
        questionnaire: { archivedAt: null, coachUserId: { not: null } },
        event: {
          athleteId: { not: null },
          startDate: {
            lte: now,
            gt: new Date(now.getTime() - REQUEST_WINDOW_MS),
          },
        },
      },
      select: CANDIDATE_SELECT,
    });
    let sent = 0;
    for (const candidate of candidates) {
      const claimed = await this.prisma.eventQuestionnaire.updateMany({
        where: {
          eventQuestionnaireId: candidate.eventQuestionnaireId,
          notifiedAt: null,
        },
        data: { notifiedAt: now },
      });
      if (claimed.count === 0) continue;
      const closesAt = (await closingDates(this.prisma, [candidate.event])).get(
        candidate.event.eventId,
      )!;
      if (now >= closesAt) continue;
      await this.deliver(candidate, 'request', closesAt);
      sent++;
    }
    return sent;
  }

  private async sendReminders(now: Date): Promise<number> {
    const candidates = await this.prisma.eventQuestionnaire.findMany({
      where: {
        notifiedAt: { not: null },
        remindedAt: null,
        answeredAt: null,
        questionnaire: { archivedAt: null, coachUserId: { not: null } },
        event: {
          athleteId: { not: null },
          startDate: { lte: now, gt: new Date(now.getTime() - OPEN_WINDOW_MS) },
        },
      },
      select: CANDIDATE_SELECT,
    });
    const closing = await closingDates(
      this.prisma,
      candidates.map((candidate) => candidate.event),
    );

    let sent = 0;
    for (const candidate of candidates) {
      const closesAt = closing.get(candidate.event.eventId)!;
      if (now < reminderTime(candidate.event.startDate, closesAt)) continue;
      if (now >= closesAt) continue;
      const claimed = await this.prisma.eventQuestionnaire.updateMany({
        where: {
          eventQuestionnaireId: candidate.eventQuestionnaireId,
          remindedAt: null,
          answeredAt: null,
        },
        data: { remindedAt: now },
      });
      if (claimed.count === 0) continue;
      await this.deliver(candidate, 'reminder', closesAt);
      sent++;
    }
    return sent;
  }

  private async deliver(
    candidate: Candidate,
    kind: 'request' | 'reminder',
    closesAt: Date,
  ) {
    const user = candidate.event.athlete?.user;
    const coach = candidate.questionnaire.coach;
    if (!user || !coach) return;
    // A coach who stopped coaching the athlete asks them nothing more
    const coaching = await this.prisma.coachAthlete.count({
      where: {
        userId: candidate.questionnaire.coachUserId!,
        athleteId: candidate.event.athleteId!,
      },
    });
    if (coaching === 0) return;
    const coachName = `${coach.firstName} ${coach.lastName}`.trim();
    const title = candidate.event.name;
    const language = user.language as Language;

    const { title: pushTitle, body } = questionnaireNotification(
      language,
      kind,
      coachName,
      title,
    );
    await this.push.sendPushNotification({
      userId: user.userId,
      title: pushTitle,
      body,
      data: {
        type: 'questionnaire',
        eventId: String(candidate.event.eventId),
      },
    });

    const appUrl = this.config.get('APP_URL')?.replace(/\/$/, '');
    if (
      !appUrl ||
      !user.email ||
      !user.emailQuestionnaires ||
      !this.email.isEnabled()
    ) {
      return;
    }
    const token = createUnsubscribeToken(
      this.config.get('JWT_SECRET_KEY'),
      user.userId,
      'questionnaires',
    );
    const timeZone =
      user.timeZone && isTimeZone(user.timeZone) ? user.timeZone : 'UTC';
    const email = buildQuestionnaireRequestEmail({
      language: user.language as EmailLanguage,
      kind,
      coachName,
      title,
      questionCount: candidate.questionnaire._count.questions,
      closesAt,
      timeZone,
      url: `${appUrl}/dashboard/calendar?event=${candidate.event.eventId}`,
      footer: {
        kind: 'list',
        reason: LIST_REASONS.questionnaires[user.language as EmailLanguage],
        unsubscribeUrl: `${appUrl}/emails/unsubscribe?token=${token}`,
        preferencesUrl: `${appUrl}/dashboard/settings?tab=profile`,
      },
    });
    const apiUrl = (
      this.config.get('API_PUBLIC_URL') ?? `${appUrl}/api`
    ).replace(/\/$/, '');
    try {
      await this.email.send({
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: {
          'List-Unsubscribe': `<${apiUrl}/emails/unsubscribe?token=${token}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
    } catch (error) {
      // The push went out: the email is not retried, to never send twice
      this.logger.error(
        `Could not email a questionnaire to ${maskEmail(user.email)}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
