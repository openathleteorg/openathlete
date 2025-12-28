import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { User } from '@openathlete/database';

import { UserTypes } from '../decorators';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const userTypes = this.reflector.getAllAndOverride(UserTypes, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!userTypes) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: User | null }>();

    if (!user) {
      return false;
    }

    const userRoles = user.roles;

    return userTypes?.some((type) => userRoles.includes(type));
  }
}
