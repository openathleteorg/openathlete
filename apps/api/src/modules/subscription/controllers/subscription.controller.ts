import {
  VerificationException,
  VerificationStatus,
} from '@apple/app-store-server-library';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Optional,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
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

import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@openathlete/database';
import {
  ApiEnvSchemaType,
  AppleAccountTokenDto,
  AppleTransactionDto,
  CreateCheckoutSessionDto,
  CurrentSubscriptionDto,
  FeatureName,
  InvoiceDto,
  Offer,
  SUPPORTER_GOAL,
  SUPPORTER_WALL_NAME_MAX_LENGTH,
  SupporterCountDto,
  UpdateSupporterWallDto,
  appleTransactionDtoSchema,
  createCheckoutSessionDtoSchema,
  featuredPrice,
  isTierPrice,
  updateSupporterWallDtoSchema,
} from '@openathlete/shared';

import { SendEmailEvent } from 'src/events';
import {
  AnalyticsService,
  stableUuid,
} from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { JwtUser } from '../../auth/decorators/user.decorator';
import { AuthUser } from '../../auth/decorators/user.decorator';
import { UserTypeGuard } from '../../auth/guards/user-type.guard';
import { AppleStoreService } from '../apple/apple-store.service';
import { FeatureAccessService } from '../services/feature-access.service';
import { StripeService } from '../services/stripe.service';
import { SubscriptionService } from '../services/subscription.service';
import { TransparencyService } from '../services/transparency.service';
import { billingEventProperties } from '../subscription-events';

@ApiTags('Subscription')
@Controller('subscription')
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
    private readonly featureAccessService: FeatureAccessService,
    private readonly appleStoreService: AppleStoreService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly transparencyService: TransparencyService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  @Get('current')
  @ApiOperation({
    summary: 'Get current subscription',
    description:
      "The authenticated user's plan (FREE or SUPPORTER), with its status, billing interval and period, cancellation status, how many athletes the user may coach, and whether this instance sells subscriptions. Creates a FREE subscription the first time.",
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
          enum: Object.values(SubscriptionPlan),
          example: 'SUPPORTER',
          description: 'Subscription plan',
        },
        billingInterval: {
          type: 'string',
          enum: ['month', 'year'],
          nullable: true,
          description: 'Billing interval of a Supporter subscription',
        },
        amountCents: {
          type: 'number',
          nullable: true,
          example: 800,
          description:
            'Price of the Supporter tier in cents, VAT included (a founder keeps the price they subscribed at)',
        },
        currency: {
          type: 'string',
          nullable: true,
          example: 'eur',
          description: 'Currency of amountCents',
        },
        entitled: {
          type: 'boolean',
          description: 'Whether the subscription gives its benefits now',
        },
        isFounder: {
          type: 'boolean',
          description:
            'Subscribed before the tiered pricing: keeps their price and unlimited coached athletes while the subscription runs',
        },
        maxAthletes: {
          type: 'number',
          nullable: true,
          example: 5,
          description: 'Athletes the user may coach; null when unlimited',
        },
        billingEnabled: {
          type: 'boolean',
          description:
            'Whether this instance sells subscriptions (false on self-hosted instances without Stripe)',
        },
        provider: {
          type: 'string',
          enum: ['stripe', 'apple'],
          nullable: true,
          description:
            'Store billing the subscription: Stripe (web) or the App Store (iOS app)',
        },
        appStoreEnabled: {
          type: 'boolean',
          description:
            'Whether the iOS app can sell subscriptions (APPLE_IAP_APP_ID is set)',
        },
        showOnSupporterWall: {
          type: 'boolean',
          description:
            'Whether the user agreed to appear on the Supporter wall of the website',
        },
        wallName: {
          type: 'string',
          nullable: true,
          description: 'Name shown on the wall instead of the first name',
        },
        status: {
          type: 'string',
          enum: Object.values(SubscriptionStatus),
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
      required: [
        'subscriptionId',
        'plan',
        'status',
        'cancelAtPeriodEnd',
        'billingInterval',
        'amountCents',
        'currency',
        'entitled',
        'isFounder',
        'maxAthletes',
        'billingEnabled',
        'provider',
        'appStoreEnabled',
        'showOnSupporterWall',
        'wallName',
      ],
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
      user.userId,
    );
    return this.toCurrentSubscriptionDto(subscription, user.userId);
  }

  private async toCurrentSubscriptionDto(
    subscription: Subscription,
    userId: number,
  ): Promise<CurrentSubscriptionDto> {
    return {
      subscriptionId: subscription.subscriptionId,
      plan: subscription.plan as CurrentSubscriptionDto['plan'],
      status: subscription.status as CurrentSubscriptionDto['status'],
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      billingInterval:
        subscription.billingInterval as CurrentSubscriptionDto['billingInterval'],
      amountCents: subscription.amountCents,
      currency: subscription.currency,
      entitled: this.subscriptionService.isEntitled(subscription),
      isFounder: subscription.isFounder,
      provider: subscription.provider as CurrentSubscriptionDto['provider'],
      maxAthletes: await this.subscriptionService.getMaxAthletesForUser(userId),
      billingEnabled: this.stripeService.billingEnabled,
      appStoreEnabled: this.appleStoreService.enabled,
      showOnSupporterWall: subscription.showOnSupporterWall,
      wallName: subscription.wallName,
      features: await this.featureAccessService.accessMap(userId),
    };
  }

  @Get('supporters')
  @ApiOperation({
    summary: 'Count the Supporters',
    description:
      'How many people are Supporters today and the goal the project aims for, shown next to the Supporter offer. Only on an instance that sells subscriptions.',
  })
  @ApiResponse({
    status: 200,
    description: 'The count and the goal',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 37 },
        goal: { type: 'number', example: SUPPORTER_GOAL },
      },
      required: ['count', 'goal'],
    },
  })
  @ApiResponse({
    status: 503,
    description: 'This instance does not sell subscriptions',
  })
  async getSupporterCount(): Promise<SupporterCountDto> {
    if (!this.stripeService.billingEnabled) {
      throw new ServiceUnavailableException('BILLING_DISABLED');
    }
    return {
      count: await this.subscriptionService.countSupporters(),
      goal: SUPPORTER_GOAL,
    };
  }

  @Patch('wall')
  @ApiOperation({
    summary: 'Appear on the Supporter wall',
    description:
      "Shows or hides the user on the Supporter wall of the website's transparency page, under a chosen name or their first name. Only running Supporter subscriptions appear there; the choice is kept if the subscription ends.",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        show: { type: 'boolean' },
        name: {
          type: 'string',
          nullable: true,
          maxLength: SUPPORTER_WALL_NAME_MAX_LENGTH,
          description:
            'Name shown instead of the first name; empty: the first name',
        },
      },
      required: ['show'],
    },
  })
  @ApiResponse({ status: 200, description: 'The updated subscription' })
  async updateSupporterWall(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateSupporterWallDtoSchema))
    body: UpdateSupporterWallDto,
  ): Promise<CurrentSubscriptionDto> {
    const subscription = await this.subscriptionService.updateSupporterWall(
      user.userId,
      body,
    );
    this.transparencyService.invalidate();
    return this.toCurrentSubscriptionDto(subscription, user.userId);
  }

  @Get('apple/account-token')
  @ApiOperation({
    summary: 'Get the App Store account token',
    description:
      'The UUID the iOS app passes to StoreKit as appAccountToken when buying the Supporter subscription, created on first use. The App Store reports it with every transaction, which ties purchases and renewals to this user. 503 when App Store purchases are not configured.',
  })
  @ApiResponse({ status: 200, description: 'The account token' })
  @ApiResponse({ status: 503, description: 'App Store purchases are off' })
  async getAppleAccountToken(
    @JwtUser() user: AuthUser,
  ): Promise<AppleAccountTokenDto> {
    this.assertAppStoreEnabled();
    return {
      appAccountToken:
        await this.subscriptionService.getOrCreateAppleAccountToken(
          user.userId,
        ),
    };
  }

  @Post('apple/transactions')
  @ApiOperation({
    summary: 'Record an App Store purchase',
    description:
      "Called by the iOS app after buying or restoring the Supporter subscription, with the StoreKit 2 transaction as signed by the App Store (jwsRepresentation). The signature is checked against Apple's root certificate, in production then sandbox (TestFlight and App Review buy in the sandbox). The transaction must carry the user's account token, or belong to no other user. Returns the updated subscription.",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { signedTransaction: { type: 'string' } },
      required: ['signedTransaction'],
    },
  })
  @ApiResponse({ status: 201, description: 'The updated subscription' })
  @ApiResponse({
    status: 400,
    description:
      'INVALID_APPLE_TRANSACTION (bad signature, app or environment) or UNKNOWN_APPLE_PRODUCT',
  })
  @ApiResponse({
    status: 403,
    description: 'APPLE_PURCHASE_OF_ANOTHER_ACCOUNT',
  })
  @ApiResponse({
    status: 409,
    description: 'ALREADY_SUPPORTER: an active Stripe subscription exists',
  })
  @ApiResponse({
    status: 503,
    description:
      'App Store purchases are off, or Apple could not be reached to check the certificates',
  })
  async recordAppleTransaction(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(appleTransactionDtoSchema))
    dto: AppleTransactionDto,
  ): Promise<CurrentSubscriptionDto> {
    this.assertAppStoreEnabled();
    let transaction;
    try {
      transaction = await this.appleStoreService.verifyTransaction(
        dto.signedTransaction,
      );
    } catch (error) {
      if (!(error instanceof VerificationException)) throw error;
      if (error.status === VerificationStatus.RETRYABLE_VERIFICATION_FAILURE) {
        throw new ServiceUnavailableException('APPLE_VERIFICATION_UNAVAILABLE');
      }
      throw new BadRequestException('INVALID_APPLE_TRANSACTION');
    }
    const before = await this.subscriptionService.getCurrentSubscription(
      user.userId,
    );
    const subscription = await this.subscriptionService.linkAppleTransaction(
      user.userId,
      transaction,
    );
    const started =
      this.subscriptionService.isEntitled(subscription) &&
      !(before && this.subscriptionService.isEntitled(before));
    if (started) {
      // Restores of a running subscription are not new ones
      this.analytics?.send(
        user.userId,
        'subscription_started',
        billingEventProperties(subscription),
        {
          uuid: stableUuid(`apple:${transaction.transactionId}`),
          set: { plan: 'SUPPORTER', store: 'apple' },
        },
      );
      await this.sendConfirmationEmail(user.userId, subscription);
    } else if (
      before?.amountCents != null &&
      (before.amountCents !== subscription.amountCents ||
        before.billingInterval !== subscription.billingInterval)
    ) {
      this.analytics?.send(user.userId, 'subscription_changed', {
        ...billingEventProperties(subscription),
        previous_amount_cents: before.amountCents,
        previous_interval: before.billingInterval,
      });
    }
    return this.toCurrentSubscriptionDto(subscription, user.userId);
  }

  private async sendConfirmationEmail(
    userId: number,
    subscription: Subscription,
  ): Promise<void> {
    const recipient = await this.prisma.user.findUnique({
      where: { userId },
      select: { email: true, firstName: true },
    });
    if (!recipient?.email) return;
    this.eventEmitter.emit(
      SendEmailEvent.SLUG,
      new SendEmailEvent({
        type: 'subscription-confirmation',
        to: recipient.email,
        params: {
          name: recipient.firstName || undefined,
          subscription_settings_url: `${this.configService.get('APP_URL')}/dashboard/settings?tab=subscription`,
          amount_cents: subscription.amountCents ?? undefined,
          interval: subscription.billingInterval ?? undefined,
        },
      }),
    );
  }

  private assertAppStoreEnabled(): void {
    if (!this.appleStoreService.enabled) {
      throw new ServiceUnavailableException('APP_STORE_PURCHASES_DISABLED');
    }
  }

  @Post('checkout')
  @ApiOperation({
    summary: 'Become a Supporter, or change tier or billing interval',
    description:
      'Creates a Stripe checkout session for the Supporter subscription at the chosen tier, billed monthly or yearly (no trial). Subscribing requires acceptTerms: the terms of sale and an immediate start within the withdrawal period; the accepted version is stored on the Stripe subscription. A user who is already a Supporter moves to the tier and interval immediately, with proration, and gets the success URL back.',
  })
  @ApiBody({
    description: 'Checkout session creation data',
    schema: {
      type: 'object',
      properties: {
        interval: {
          type: 'string',
          enum: ['month', 'year'],
          example: 'year',
          description: 'Billing interval of the Supporter subscription',
        },
        amountCents: {
          type: 'number',
          example: 8000,
          description:
            'Price of the Supporter tier for the interval, in cents (500, 800 or 1200 a month; 5000, 8000 or 12000 a year). Defaults to the featured tier.',
        },
        acceptTerms: {
          type: 'boolean',
          enum: [true],
          description:
            'Required to subscribe: accepts the terms of sale and asks for an immediate start',
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
      required: ['interval', 'successUrl', 'cancelUrl'],
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
    description:
      'Bad request - invalid interval, UNKNOWN_TIER, or TERMS_NOT_ACCEPTED when subscribing without accepting the terms of sale',
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
    const amountCents =
      dto.amountCents ?? featuredPrice(Offer.SUPPORTER, dto.interval);
    if (
      amountCents === null ||
      !isTierPrice(Offer.SUPPORTER, dto.interval, amountCents)
    ) {
      throw new BadRequestException('UNKNOWN_TIER');
    }
    // A Supporter changing tier or billing interval
    const currentSubscription =
      await this.subscriptionService.getCurrentSubscription(user.userId);
    // Supporters through the App Store switch or cancel in iOS settings
    await this.subscriptionService.assertBilledByStripe(user.userId);
    if (
      currentSubscription?.stripeSubscriptionId &&
      (currentSubscription.status === SubscriptionStatus.active ||
        currentSubscription.status === SubscriptionStatus.trialing)
    ) {
      const updatedSubscription = await this.stripeService.changeSupporterPrice(
        currentSubscription.stripeSubscriptionId,
        dto.interval,
        amountCents,
      );
      await this.subscriptionService.updateSubscriptionFromWebhook(
        updatedSubscription,
      );
      await this.analytics?.send(user.userId, 'subscription_changed', {
        offer: Offer.SUPPORTER,
        amount_cents: amountCents,
        interval: dto.interval,
        provider: 'stripe',
        founder: currentSubscription.isFounder,
        previous_amount_cents: currentSubscription.amountCents,
        previous_interval: currentSubscription.billingInterval,
      });
      // No checkout needed: back to the app
      return { sessionId: null, url: dto.successUrl };
    }

    if (!dto.acceptTerms) {
      throw new BadRequestException('TERMS_NOT_ACCEPTED');
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: { email: true },
    });
    if (!userRecord) {
      throw new NotFoundException('User not found');
    }
    const customer = await this.stripeService.getOrCreateCustomer(
      user.userId,
      userRecord.email,
    );

    // Create checkout session for new subscription
    const session = await this.stripeService.createCheckoutSession(
      customer.id,
      dto.interval,
      amountCents,
      dto.successUrl,
      dto.cancelUrl,
    );

    // Sent from here: the redirect to Stripe often cuts off the browser's event
    await this.analytics?.capture(user.userId, 'checkout_started', {
      interval: dto.interval,
      amount_cents: amountCents,
      feature: dto.feature ?? null,
    });

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
    await this.subscriptionService.cancelSubscription(user.userId);
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
    await this.subscriptionService.resumeSubscription(user.userId);
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
      user.userId,
    );

    if (!subscription?.stripeCustomerId) {
      return [];
    }

    const invoices = await this.stripeService.getCustomerInvoices(
      subscription.stripeCustomerId,
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
    await this.subscriptionService.assertBilledByStripe(user.userId);
    const stripeCustomerId =
      await this.subscriptionService.getOrCreateStripeCustomerId(user.userId);

    const defaultReturnUrl = `${this.configService.get('APP_URL')}/dashboard/settings/subscription`;
    const session = await this.stripeService.createCustomerPortalSession(
      stripeCustomerId,
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
      "Checks whether the athlete or one of their coaches has a plan including a feature (AI_GENERATION, AI_RPE_QUESTIONS: hosted AI on the instance keys). Whether an AI feature can actually run, including on users' own keys, is given by GET /ai/access.",
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
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
    @Param('featureName') featureName: FeatureName,
  ): Promise<{ hasAccess: boolean }> {
    // Whose plans cover an athlete is the athlete's and their coaches' business
    const readable =
      user.athlete?.athleteId === athleteId ||
      user.coachAthletes?.some((link) => link.athleteId === athleteId);
    if (!readable) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
    const hasAccess =
      await this.featureAccessService.canAccessFeatureForAthlete(
        athleteId,
        featureName,
      );

    return { hasAccess };
  }
}
