import { subject } from '@casl/ability';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Athlete } from '@openathlete/database';
import { SPORT_TYPE, YearReviewDto } from '@openathlete/shared';

import { startOfZonedDay, validTimeZone } from 'src/common/utils/time-zone';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  YearActivity,
  YearRace,
  buildYearReview,
} from '../helpers/year-review';
import { RecordService } from './record.service';
import { TrainingLoadService } from './training-load.service';

interface ActivityRow {
  name: string;
  start_date: Date;
  end_date: Date;
  day: string;
  minute: number;
  weekday: number;
  sport: SPORT_TYPE;
  moving_time: number;
  distance: number;
  elevation_gain: number;
  average_heartrate: number | null;
  is_race: boolean;
  provider: string | null;
}

/**
 * The athlete's year in one read: what the year review story shows. A year
 * is a few hundred activities, so it is read whole and summed here, where
 * the rules are tested, rather than in SQL.
 */
@Injectable()
export class YearReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly records: RecordService,
    private readonly trainingLoad: TrainingLoadService,
  ) {}

  async getYearReview(
    user: AuthUser,
    athleteId: Athlete['athleteId'],
    year: number,
    now = new Date(),
  ): Promise<YearReviewDto> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId },
      include: { user: { select: { firstName: true, timeZone: true } } },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    // The year of the athlete's calendar, wherever the server runs
    const timeZone = validTimeZone(athlete.user.timeZone);
    const from = startOfZonedDay(`${year}-01-01`, timeZone);
    const to = startOfZonedDay(`${year + 1}-01-01`, timeZone);
    if (from > now) {
      throw new BadRequestException('This year has not started yet');
    }

    const [activities, races, records, form, plan] = await Promise.all([
      this.activities(athleteId, from, to, timeZone),
      this.races(athleteId, from, to, timeZone),
      this.records.getPeriodBests(user, athleteId, from, to),
      this.trainingLoad.getDailyForm(user, from, to, athleteId, false),
      this.plan(athleteId, from, to < now ? to : now),
    ]);

    return buildYearReview({
      year,
      firstName: athlete.user.firstName || null,
      activities: activities.map(toActivity),
      races,
      records,
      form,
      plan,
    });
  }

  /** The activities of the year, their start read in the athlete's zone */
  private activities(
    athleteId: number,
    from: Date,
    to: Date,
    timeZone: string,
  ) {
    return this.prisma.$queryRaw<ActivityRow[]>`
      SELECT e.name, e.start_date, e.end_date,
        to_char(l.local, 'YYYY-MM-DD') AS day,
        (extract(hour FROM l.local) * 60 + extract(minute FROM l.local))::int AS minute,
        extract(isodow FROM l.local)::int AS weekday,
        a.sport::text AS sport, a.moving_time, a.distance, a.elevation_gain,
        a.average_heartrate, a.is_race, a.provider::text AS provider
      FROM event e
      JOIN event_activity a ON a.event_id = e.event_id
      CROSS JOIN LATERAL (
        SELECT e.start_date AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone} AS local
      ) l
      WHERE e.athlete_id = ${athleteId}
        AND e.type = 'ACTIVITY'
        AND e.start_date >= ${from}
        AND e.start_date < ${to}
      ORDER BY e.start_date`;
  }

  /** Races of the calendar run this year, with the activity linked to each */
  private async races(
    athleteId: number,
    from: Date,
    to: Date,
    timeZone: string,
  ): Promise<YearRace[]> {
    const rows = await this.prisma.$queryRaw<
      (ActivityRow & {
        race_name: string;
        priority: YearRace['priority'];
        goal_duration: number | null;
      })[]
    >`
      SELECT e.name AS race_name, c.priority::text AS priority,
        c.goal_duration, ae.name, ae.start_date, ae.end_date,
        to_char(l.local, 'YYYY-MM-DD') AS day,
        (extract(hour FROM l.local) * 60 + extract(minute FROM l.local))::int AS minute,
        extract(isodow FROM l.local)::int AS weekday,
        a.sport::text AS sport, a.moving_time, a.distance, a.elevation_gain,
        a.average_heartrate, a.is_race, a.provider::text AS provider
      FROM event e
      JOIN event_competition c ON c.event_id = e.event_id
      JOIN event_activity a ON a.event_activity_id = c.related_activity_id
      JOIN event ae ON ae.event_id = a.event_id
      CROSS JOIN LATERAL (
        SELECT ae.start_date AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone} AS local
      ) l
      WHERE e.athlete_id = ${athleteId}
        AND e.type = 'COMPETITION'
        AND ae.start_date >= ${from}
        AND ae.start_date < ${to}`;
    return rows.map((row) => ({
      name: row.race_name,
      priority: row.priority,
      goalDuration: row.goal_duration,
      activity: toActivity(row),
    }));
  }

  /** Planned sessions of the year already due, and those done */
  private async plan(athleteId: number, from: Date, until: Date) {
    const [row] = await this.prisma.$queryRaw<
      { planned: number; done: number }[]
    >`
      SELECT count(*)::int AS planned,
        count(t.related_activity_id)::int AS done
      FROM event e
      JOIN event_training t ON t.event_id = e.event_id
      WHERE e.athlete_id = ${athleteId}
        AND e.type = 'TRAINING'
        AND e.start_date >= ${from}
        AND e.start_date < ${until}`;
    return row ?? { planned: 0, done: 0 };
  }
}

const toActivity = (row: ActivityRow): YearActivity => ({
  day: row.day,
  minute: row.minute,
  weekday: row.weekday,
  sport: row.sport,
  name: row.name,
  startDate: row.start_date,
  duration: Math.round(
    (row.end_date.getTime() - row.start_date.getTime()) / 1000,
  ),
  movingTime: row.moving_time,
  distance: row.distance,
  elevationGain: row.elevation_gain,
  averageHeartrate: row.average_heartrate,
  isRace: row.is_race,
  fromGarmin: row.provider === 'GARMIN',
});
