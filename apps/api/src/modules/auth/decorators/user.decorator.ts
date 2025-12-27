import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Athlete, CoachAthlete, User } from '@openathlete/database';

export type AuthUser = Pick<User, 'userId' | 'email'> & {
  athlete: Pick<Athlete, 'athleteId'> | null;
  coach_athletes?: Array<Pick<CoachAthlete, 'athleteId'>>;
};

export const JwtUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
