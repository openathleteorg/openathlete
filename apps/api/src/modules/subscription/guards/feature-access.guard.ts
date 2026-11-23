import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Feature } from '@openathlete/shared';

import { AuthUser } from '../../auth/decorators/user.decorator';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import {
  FeatureAccessService,
  featureLockedException,
} from '../services/feature-access.service';

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureAccessService: FeatureAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<Feature | undefined>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;

    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!(await this.featureAccessService.can(user.userId, feature))) {
      throw featureLockedException(feature);
    }
    return true;
  }
}
