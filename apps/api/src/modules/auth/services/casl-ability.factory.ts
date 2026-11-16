import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Subjects as CASLSubjects } from '@casl/prisma';

import { Injectable } from '@nestjs/common';

import {
  AgentMessage,
  AgentMessageBlock,
  AgentThread,
  Athlete,
  AthleteMetric,
  Cycle,
  Event,
  User,
  Workout,
} from '@openathlete/database';
import { CLUB_COACH_ROLES, CLUB_STAFF_ROLES } from '@openathlete/shared';

import { AuthUser } from '../decorators/user.decorator';
import { PrismaQuery, createPrismaAbility } from './casl-prisma';

export type CRUD = 'manage' | 'create' | 'read' | 'update' | 'delete';

export type Subjects = CASLSubjects<{
  User: User;
  Athlete: Athlete;
  AthleteMetric: AthleteMetric;
  Event: Event;
  Cycle: Cycle;
  Workout: Workout;
  AgentThread: AgentThread;
  AgentMessage: AgentMessage;
  AgentMessageBlock: AgentMessageBlock;
}>;

export type AppAbility = PureAbility<[CRUD, Subjects | 'all'], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  constructor() {}

  private _userFactory(
    params: {
      user: AuthUser;
    },
    { can }: AbilityBuilder<AppAbility>,
  ) {
    const { user } = params || {};

    if (!user) return;

    can('manage', 'User', { userId: user.userId });
    can('manage', 'Athlete', { userId: user.userId });

    can('manage', 'Event', { templates: { some: { userId: user.userId } } });

    // The club library: its coaches edit it, its whole staff uses it
    const clubsWhere = (roles: readonly string[]) =>
      (user.clubMemberships ?? [])
        .filter((membership) => roles.includes(membership.role))
        .map((membership) => membership.clubId);
    const coachClubs = clubsWhere(CLUB_COACH_ROLES);
    const staffClubs = clubsWhere(CLUB_STAFF_ROLES);
    if (coachClubs.length) {
      can('manage', 'Event', {
        templates: { some: { clubId: { in: coachClubs } } },
      });
    }
    if (staffClubs.length) {
      can('read', 'Event', {
        templates: { some: { clubId: { in: staffClubs } } },
      });
    }

    if (user.athlete) {
      can('manage', 'Event', { athleteId: user.athlete.athleteId });
      can('manage', 'Cycle', { athleteId: user.athlete.athleteId });
      can('manage', 'AthleteMetric', { athleteId: user.athlete.athleteId });
      can('manage', 'Workout', {
        eventTraining: { event: { athleteId: user.athlete.athleteId } },
      });
    }

    if (user.coachAthletes) {
      user.coachAthletes.forEach((coachAthlete) => {
        can('manage', 'Athlete', { athleteId: coachAthlete.athleteId });
        can('manage', 'AthleteMetric', {
          athleteId: coachAthlete.athleteId,
        });
        can('manage', 'Event', { athleteId: coachAthlete.athleteId });
        can('manage', 'Cycle', { athleteId: coachAthlete.athleteId });
        can('manage', 'Workout', {
          eventTraining: { event: { athleteId: coachAthlete.athleteId } },
        });
      });
    }

    // Agent permissions: users can manage their own threads, messages, and blocks
    can('manage', 'AgentThread', { userId: user.userId });
    can('manage', 'AgentMessage', {
      thread: { userId: user.userId },
    });
    can('manage', 'AgentMessageBlock', {
      message: { thread: { userId: user.userId } },
    });
  }

  async getFor(params: { user: AuthUser }): Promise<AppAbility> {
    const { user } = params || {};

    const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

    this._userFactory({ user }, builder);

    return builder.build();
  }
}
