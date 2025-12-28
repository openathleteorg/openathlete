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

import { AuthUser } from '../decorators/user.decorator';
import { PrismaQuery, createPrismaAbility } from './casl-prisma';
import { UserService } from './user.service';

export type CRUD = 'manage' | 'create' | 'read' | 'update' | 'delete';

export type Subjects = CASLSubjects<{
  user: User;
  athlete: Athlete;
  AthleteMetric: AthleteMetric;
  event: Event;
  cycle: Cycle;
  workout: Workout;
  AgentThread: AgentThread;
  AgentMessage: AgentMessage;
  AgentMessageBlock: AgentMessageBlock;
}>;

export type AppAbility = PureAbility<[CRUD, Subjects | 'all'], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly userService: UserService) {}

  private _userFactory(
    params: {
      user: AuthUser;
    },
    { can }: AbilityBuilder<AppAbility>,
  ) {
    const { user } = params || {};

    if (!user) return;

    can('manage', 'user', { userId: user.userId });
    can('manage', 'athlete', { userId: user.userId });

    can('manage', 'event', { templates: { some: { userId: user.userId } } });

    if (user.athlete) {
      can('manage', 'event', { athleteId: user.athlete.athleteId });
      can('manage', 'cycle', { athleteId: user.athlete.athleteId });
      can('manage', 'AthleteMetric', { athleteId: user.athlete.athleteId });
      can('manage', 'workout', {
        eventTraining: { event: { athleteId: user.athlete.athleteId } },
      });
    }

    if (user.coachAthletes) {
      user.coachAthletes.forEach((coachAthlete) => {
        can('manage', 'athlete', { athleteId: coachAthlete.athleteId });
        can('manage', 'AthleteMetric', {
          athleteId: coachAthlete.athleteId,
        });
        can('manage', 'event', { athleteId: coachAthlete.athleteId });
        can('manage', 'cycle', { athleteId: coachAthlete.athleteId });
        can('manage', 'workout', {
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
