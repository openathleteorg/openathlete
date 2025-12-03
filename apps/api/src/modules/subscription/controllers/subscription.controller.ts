import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  CreateCheckoutSessionDto,
  CurrentSubscriptionDto,
  FeatureName,
  InvoiceDto,
  createCheckoutSessionDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from '../../auth';
import { AuthUser } from '../../auth/decorators/user.decorator';
import { FeatureAccessService } from '../services/feature-access.service';
import { StripeService } from '../services/stripe.service';
import { SubscriptionService } from '../services/subscription.service';

@Controller('subscription')
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
    private readonly featureAccessService: FeatureAccessService,
  ) {}

  @Get('current')
  async getCurrentSubscription(
    @JwtUser() user: AuthUser,
  ): Promise<CurrentSubscriptionDto> {
    const subscription = await this.subscriptionService.getOrCreateSubscription(
      user.user_id,
    );

    return {
      subscriptionId: subscription.subscription_id,
      plan: subscription.plan as CurrentSubscriptionDto['plan'],
      status: subscription.status as CurrentSubscriptionDto['status'],
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  @Post('checkout')
  async createCheckoutSession(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCheckoutSessionDtoSchema))
    dto: CreateCheckoutSessionDto,
  ) {
    // Get user email
    const userRecord = await this.subscriptionService['prisma'].user.findUnique(
      {
        where: { user_id: user.user_id },
        select: { email: true },
      },
    );

    if (!userRecord) {
      throw new Error('User not found');
    }

    // Get or create Stripe customer
    const customer = await this.stripeService.getOrCreateCustomer(
      user.user_id,
      userRecord.email,
    );

    // Check if user has an active subscription
    const currentSubscription =
      await this.subscriptionService.getCurrentSubscription(user.user_id);

    // If user has an active subscription with Stripe, update it instead of creating a new one
    if (
      currentSubscription?.stripe_subscription_id &&
      (currentSubscription.status === 'active' ||
        currentSubscription.status === 'trialing')
    ) {
      // Update existing subscription
      const updatedSubscription =
        await this.stripeService.updateSubscriptionPlan(
          currentSubscription.stripe_subscription_id,
          dto.plan,
        );

      // Update subscription in database
      await this.subscriptionService.updateSubscriptionFromWebhook(
        updatedSubscription,
      );

      // Return success URL since we don't need to redirect to Stripe
      return {
        sessionId: null,
        url: dto.successUrl,
      };
    }

    // Create checkout session for new subscription
    const session = await this.stripeService.createCheckoutSession(
      customer.id,
      dto.plan,
      dto.successUrl,
      dto.cancelUrl,
    );

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  @Post('cancel')
  async cancelSubscription(@JwtUser() user: AuthUser) {
    await this.subscriptionService.cancelSubscription(user.user_id);
    return { success: true };
  }

  @Post('resume')
  async resumeSubscription(@JwtUser() user: AuthUser) {
    await this.subscriptionService.resumeSubscription(user.user_id);
    return { success: true };
  }

  @Get('invoices')
  async getInvoices(@JwtUser() user: AuthUser): Promise<InvoiceDto[]> {
    const subscription = await this.subscriptionService.getCurrentSubscription(
      user.user_id,
    );

    if (!subscription?.stripe_customer_id) {
      return [];
    }

    const invoices = await this.stripeService.getCustomerInvoices(
      subscription.stripe_customer_id,
    );

    return invoices.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents to euros
      currency: invoice.currency,
      status: invoice.status ?? 'unknown',
      createdAt: new Date(invoice.created * 1000),
      invoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
    }));
  }

  @Get('portal')
  async getCustomerPortalUrl(
    @JwtUser() user: AuthUser,
    @Query('returnUrl') returnUrl?: string,
  ) {
    const subscription = await this.subscriptionService.getCurrentSubscription(
      user.user_id,
    );

    if (!subscription?.stripe_customer_id) {
      throw new Error('No Stripe customer found');
    }

    const defaultReturnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/settings/subscription`;
    const session = await this.stripeService.createCustomerPortalSession(
      subscription.stripe_customer_id,
      returnUrl || defaultReturnUrl,
    );

    return {
      url: session.url,
    };
  }

  @Get('athlete/:athleteId/feature-access/:featureName')
  async getAthleteFeatureAccess(
    @Param('athleteId') athleteId: string,
    @Param('featureName') featureName: FeatureName,
  ): Promise<{ hasAccess: boolean }> {
    const hasAccess =
      await this.featureAccessService.canAccessFeatureForAthlete(
        parseInt(athleteId, 10),
        featureName,
      );

    return { hasAccess };
  }
}
