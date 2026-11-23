import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AppleStoreService } from './apple/apple-store.service';
import { AppleNotificationsController } from './controllers/apple-notifications.controller';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { TransparencyController } from './controllers/transparency.controller';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { FeatureAccessService } from './services/feature-access.service';
import { StripeService } from './services/stripe.service';
import { SubscriptionService } from './services/subscription.service';
import { TransparencyService } from './services/transparency.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    SubscriptionController,
    StripeWebhookController,
    AppleNotificationsController,
    TransparencyController,
  ],
  providers: [
    StripeService,
    AppleStoreService,
    SubscriptionService,
    FeatureAccessService,
    FeatureAccessGuard,
    TransparencyService,
  ],
  exports: [
    SubscriptionService,
    StripeService,
    FeatureAccessService,
    FeatureAccessGuard,
  ],
})
export class SubscriptionModule {}
