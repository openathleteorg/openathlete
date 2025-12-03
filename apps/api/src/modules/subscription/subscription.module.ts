import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { PrismaService } from '../prisma/services/prisma.service';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { FeatureAccessService } from './services/feature-access.service';
import { StripeService } from './services/stripe.service';
import { SubscriptionService } from './services/subscription.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SubscriptionController, StripeWebhookController],
  providers: [
    PrismaService,
    StripeService,
    SubscriptionService,
    FeatureAccessService,
    FeatureAccessGuard,
  ],
  exports: [SubscriptionService, FeatureAccessService, FeatureAccessGuard],
})
export class SubscriptionModule {}
