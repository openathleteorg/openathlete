import { AbilityBuilder, PureAbility } from '@casl/ability';
import { Subjects as CASLSubjects } from '@casl/prisma';

import { Injectable } from '@nestjs/common';

import {
  agent_message,
  agent_message_block,
  agent_thread,
  athlete,
  cycle,
  event,
  user,
} from '@openathlete/database';

import { AuthUser } from '../decorators/user.decorator';
import { PrismaQuery, createPrismaAbility } from './casl-prisma';
import { UserService } from './user.service';

export type CRUD = 'manage' | 'create' | 'read' | 'update' | 'delete';

export type Subjects = CASLSubjects<{
  user: user;
  athlete: athlete;
  event: event;
  cycle: cycle;
  agent_thread: agent_thread;
  agent_message: agent_message;
  agent_message_block: agent_message_block;
}>;

export type AppAbility = PureAbility<[CRUD, Subjects | 'all'], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly userService: UserService) {}

  private _userFactory(
    params: {
      user: AuthUser;
    },
    { can, cannot }: AbilityBuilder<AppAbility>,
  ) {
    const { user } = params || {};

    if (!user) return;

    can('manage', 'user', { user_id: user.user_id });
    can('manage', 'athlete', { user_id: user.user_id });

    can('manage', 'event', { templates: { some: { user_id: user.user_id } } });

    if (user.athlete) {
      can('manage', 'event', { athlete_id: user.athlete.athlete_id });
      can('manage', 'cycle', { athlete_id: user.athlete.athlete_id });
    }

    if (user.coach_athletes) {
      user.coach_athletes.forEach((coachAthlete) => {
        can('manage', 'event', { athlete_id: coachAthlete.athlete_id });
        can('manage', 'cycle', { athlete_id: coachAthlete.athlete_id });
      });
    }

    // Agent permissions: users can manage their own threads, messages, and blocks
    can('manage', 'agent_thread', { user_id: user.user_id });
    can('manage', 'agent_message', {
      thread: { user_id: user.user_id },
    });
    can('manage', 'agent_message_block', {
      message: { thread: { user_id: user.user_id } },
    });
  }

  async getFor(params: { user: AuthUser }): Promise<AppAbility> {
    const { user } = params || {};

    const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

    this._userFactory({ user }, builder);

    return builder.build();
  }
}
