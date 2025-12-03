import { SetMetadata } from '@nestjs/common';

import { FeatureName } from '@openathlete/shared';

export const REQUIRE_FEATURE_KEY = 'requireFeature';

/**
 * Decorator to mark endpoints that require a specific feature
 */
export const RequireFeature = (feature: FeatureName) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);
