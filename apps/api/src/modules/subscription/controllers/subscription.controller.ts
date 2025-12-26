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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { subscription_plan, subscription_status } from '@openathlete/database';
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

@ApiTags('Subscription')
@Controller('subscription')
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
    private readonly featureAccessService: FeatureAccessService,
  ) {}

  @Get('current')
  @ApiOperation({
    summary: 'Get current subscription',
    description:
      "Retrieves the authenticated user's current subscription information. If no subscription exists, creates a default FREE subscription. Returns subscription details including plan, status, billing period dates, trial information, and cancellation status.",
  })
  @ApiResponse({
    status: 200,
    description: 'Current subscription retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'number',
          example: 1,
          description: 'Internal subscription ID',
        },
        plan: {
          type: 'string',
          enum: Object.values(subscription_plan),
          example: 'COACH_PRO',
          description: 'Subscription plan name',
        },
        status: {
          type: 'string',
          enum: Object.values(subscription_status),
          example: 'active',
          description: 'Subscription status from Stripe',
        },
        currentPeriodStart: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          example: '2024-01-01T00:00:00.000Z',
          description: 'Start date of current billing period',
        },
        currentPeriodEnd: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          example: '2024-02-01T00:00:00.000Z',
          description: 'End date of current billing period',
        },
        trialEnd: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          example: '2024-01-15T00:00:00.000Z',
          description: 'Trial end date (null if no trial)',
        },
        cancelAtPeriodEnd: {
          type: 'boolean',
          example: false,
          description:
            'Whether the subscription is scheduled to cancel at the end of the current period',
        },
      },
      required: ['subscriptionId', 'plan', 'status', 'cancelAtPeriodEnd'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
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
      trialEnd: subscription.trial_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  @Post('checkout')
  @ApiOperation({
    summary: 'Create or update subscription checkout session',
    description:
      "Creates a Stripe checkout session for a new subscription or updates an existing active subscription. If the user already has an active or trialing subscription with Stripe, the plan is updated immediately (with proration) and the success URL is returned. Otherwise, a new Stripe checkout session is created. For new paid subscriptions, a 15-day trial is automatically applied if the customer hasn't used a trial before. The checkout session includes metadata about the plan for webhook processing.",
  })
  @ApiBody({
    description: 'Checkout session creation data',
    schema: {
      type: 'object',
      properties: {
        plan: {
          type: 'string',
          enum: Object.values(subscription_plan),
          example: 'COACH_PRO',
          description: 'Subscription plan to subscribe to',
        },
        successUrl: {
          type: 'string',
          format: 'uri',
          example:
            'https://app.openathlete.org/dashboard/settings/subscription?success=true',
          description: 'URL to redirect to after successful checkout',
        },
        cancelUrl: {
          type: 'string',
          format: 'uri',
          example:
            'https://app.openathlete.org/dashboard/settings/subscription?canceled=true',
          description: 'URL to redirect to if checkout is canceled',
        },
      },
      required: ['plan', 'successUrl', 'cancelUrl'],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Checkout session created or subscription updated successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          nullable: true,
          description:
            'Stripe checkout session ID (null if subscription was updated directly)',
          example: 'cs_test_abc123...',
        },
        url: {
          type: 'string',
          format: 'uri',
          description:
            'Checkout URL to redirect user to, or success URL if subscription was updated',
          example: 'https://checkout.stripe.com/c/pay/cs_test_abc123...',
        },
      },
      required: ['url'],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid plan or price ID not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - user not found',
  })
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
  @ApiOperation({
    summary: 'Cancel subscription at period end',
    description:
      "Schedules the subscription to be canceled at the end of the current billing period. The subscription remains active until the period ends, allowing continued access to features. After cancellation, the subscription status will change to 'canceled' and access will be revoked. This action can be reversed by resuming the subscription before the period ends.",
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription scheduled for cancellation',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - subscription or Stripe subscription ID not found',
  })
  async cancelSubscription(@JwtUser() user: AuthUser) {
    await this.subscriptionService.cancelSubscription(user.user_id);
    return { success: true };
  }

  @Post('resume')
  @ApiOperation({
    summary: 'Resume canceled subscription',
    description:
      "Removes the cancellation scheduled for the end of the billing period. The subscription will continue to renew automatically. This can only be used if the subscription was previously canceled but hasn't reached the end of the period yet.",
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancellation removed successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - subscription or Stripe subscription ID not found',
  })
  async resumeSubscription(@JwtUser() user: AuthUser) {
    await this.subscriptionService.resumeSubscription(user.user_id);
    return { success: true };
  }

  @Get('invoices')
  @ApiOperation({
    summary: 'Get subscription invoices',
    description:
      "Retrieves the list of invoices for the authenticated user's Stripe customer. Returns up to 10 most recent invoices. If the user doesn't have a Stripe customer ID, returns an empty array. Invoice amounts are converted from cents to the currency unit (e.g., euros).",
  })
  @ApiResponse({
    status: 200,
    description: 'List of invoices retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'in_abc123...',
            description: 'Stripe invoice ID',
          },
          amount: {
            type: 'number',
            example: 19.99,
            description:
              'Invoice amount in currency unit (converted from cents)',
          },
          currency: {
            type: 'string',
            example: 'eur',
            description: 'Currency code (lowercase)',
          },
          status: {
            type: 'string',
            example: 'paid',
            description:
              'Invoice status (paid, open, void, uncollectible, etc.)',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: 'Invoice creation date',
          },
          invoiceUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://invoice.stripe.com/i/acct_abc123...',
            description: 'URL to view invoice in Stripe',
          },
          invoicePdf: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://pay.stripe.com/invoice/abc123/pdf',
            description: 'URL to download invoice PDF',
          },
        },
        required: ['id', 'amount', 'currency', 'status', 'createdAt'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
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
  @ApiOperation({
    summary: 'Get Stripe customer portal URL',
    description:
      'Creates a Stripe customer portal session and returns the URL. The customer portal allows users to manage their subscription, update payment methods, view invoices, and update billing information. The portal session is temporary and expires after use. If no returnUrl is provided, defaults to the subscription settings page.',
  })
  @ApiQuery({
    name: 'returnUrl',
    type: String,
    description:
      'URL to redirect to after the user finishes in the customer portal',
    required: false,
    example: 'https://app.openathlete.org/dashboard/settings/subscription',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer portal URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          example: 'https://billing.stripe.com/p/session/abc123...',
          description: 'Temporary URL to access Stripe customer portal',
        },
      },
      required: ['url'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no Stripe customer found for user',
  })
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
  @ApiOperation({
    summary: 'Check athlete feature access',
    description:
      'Checks if a specific athlete has access to a given feature. Access is granted if either the athlete themselves or any of their coaches has an active subscription that includes the feature. Currently supported features: AI_GENERATION (AI event generation) and AI_RPE_QUESTIONS (AI RPE questions). This endpoint is useful for paywall checks and feature gating.',
  })
  @ApiParam({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete to check feature access for',
    example: 1,
  })
  @ApiParam({
    name: 'featureName',
    type: String,
    enum: ['ai-generation', 'ai-rpe-questions'],
    description: 'Name of the feature to check access for',
    example: 'ai-generation',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature access check result',
    schema: {
      type: 'object',
      properties: {
        hasAccess: {
          type: 'boolean',
          example: true,
          description:
            'Whether the athlete (or their coaches) has access to the feature',
        },
      },
      required: ['hasAccess'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
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
