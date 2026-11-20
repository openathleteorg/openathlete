import { SetMetadata } from '@nestjs/common';

import { Feature } from '@openathlete/shared';

export const REQUIRE_FEATURE_KEY = 'requireFeature';

/**
 * Refuses the endpoint with FEATURE_LOCKED when the user may not use the
 * feature (see FEATURES). Without billing it never refuses. Use it with
 * FeatureAccessGuard; club-scoped checks call FeatureAccessService.assert.
 */
export const RequireFeature = (feature: Feature) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);
