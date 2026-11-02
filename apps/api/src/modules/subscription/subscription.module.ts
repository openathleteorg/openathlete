import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AppleStoreService } from './apple/apple-store.service';
import { AppleNotificationsController } from './controllers/apple-notifications.controller';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { FeatureAccessService } from './services/feature-access.service';
import { StripeService } from './services/stripe.service';
import { SubscriptionService } from './services/subscription.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    SubscriptionController,
    StripeWebhookController,
    AppleNotificationsController,
  ],
  providers: [
    StripeService,
    AppleStoreService,
    SubscriptionService,
    FeatureAccessService,
    FeatureAccessGuard,
  ],
  exports: [
    SubscriptionService,
    StripeService,
    FeatureAccessService,
    FeatureAccessGuard,
  ],
})
export class SubscriptionModule {}
