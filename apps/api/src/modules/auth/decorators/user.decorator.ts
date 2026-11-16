import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Athlete, ClubMember, CoachAthlete, User } from '@openathlete/database';

export type AuthUser = Pick<User, 'userId' | 'email'> & {
  athlete: Pick<Athlete, 'athleteId'> | null;
  coachAthletes?: Array<Pick<CoachAthlete, 'athleteId'>>;
  /** The clubs the user belongs to, for their libraries */
  clubMemberships?: Array<Pick<ClubMember, 'clubId' | 'role'>>;
};

export const JwtUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
