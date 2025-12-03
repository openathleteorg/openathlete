import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { FeatureName } from '@openathlete/shared';

import { AuthUser } from '../../auth/decorators/user.decorator';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { FeatureAccessService } from '../services/feature-access.service';

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureAccessService: FeatureAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<FeatureName>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true; // No feature requirement
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasAccess = await this.featureAccessService.canAccessFeature(
      user.user_id,
      requiredFeature,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Feature '${requiredFeature}' requires a paid subscription`,
      );
    }

    return true;
  }
}
