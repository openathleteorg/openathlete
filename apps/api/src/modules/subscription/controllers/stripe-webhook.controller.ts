import Stripe from 'stripe';

import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Optional,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { SendEmailEvent } from 'src/events';
import {
  AnalyticsService,
  stableUuid,
} from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { StripeService } from '../services/stripe.service';
import {
  SubscriptionService,
  SubscriptionUserMissingError,
} from '../services/subscription.service';

@ApiTags('Subscription')
@SkipThrottle()
@Controller('subscription/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description:
      "Receives and processes webhook events from Stripe. This endpoint verifies the webhook signature using the Stripe webhook secret to ensure the request is authentic and hasn't been tampered with. The raw request body is required for signature verification. After verification, the event is processed based on its type:\n\n" +
      '**Handled Events:**\n' +
      '- `checkout.session.completed`: Records the Supporter subscription after a successful Stripe checkout (user ID from the customer metadata, billing interval and periods from Stripe) and sends a confirmation email.\n' +
      '- `customer.subscription.updated`: Updates the subscription status, billing interval, billing periods and cancellation status.\n' +
      '- `customer.subscription.deleted`: Marks the subscription as canceled when Stripe deletes it. Updates the subscription status to canceled.\n' +
      '- `invoice.paid`: Logs payment confirmation.\n\n' +
      '**Security:** The endpoint verifies the Stripe signature header to ensure requests are authentic. Invalid signatures are rejected and logged. The endpoint returns 200 OK to acknowledge receipt, even if the event type is unhandled, to prevent Stripe from retrying the webhook.',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description:
      'Stripe webhook signature header used to verify the request authenticity. Must be provided by Stripe when sending webhook events.',
    required: true,
    example: 't=1234567890,v1=abc123def456...',
  })
  @ApiResponse({
    status: 200,
    description:
      'Webhook received and processed successfully (or event type unhandled)',
    schema: {
      type: 'object',
      properties: {
        received: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - webhook payload missing or signature verification failed',
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody;

    if (!payload) {
      this.logger.error('Webhook payload is missing');
      return;
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.verifyWebhookSignature(payload, signature);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error}`);
      return;
    }

    this.logger.log(`Received webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleCheckoutSessionCompleted(session, event.id);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionUpdated(subscription, event.id);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionDeleted(subscription, event.id);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handleInvoicePaid(invoice, event.id);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.reportForCustomer(
            invoice.customer,
            'subscription_payment_failed',
            event.id,
            {
              attempt: invoice.attempt_count,
              amount: invoice.amount_due / 100,
              currency: invoice.currency,
            },
          );
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          await this.reportForCustomer(
            charge.customer,
            'subscription_refunded',
            event.id,
            { amount: charge.amount_refunded / 100, currency: charge.currency },
          );
          break;
        }

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling webhook ${event.type}: ${error}`);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
    eventId: string,
  ) {
    if (session.mode !== 'subscription') {
      return;
    }

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!customerId || !subscriptionId) {
      this.logger.error(
        `Missing customer or subscription ID in checkout session: ${session.id}`,
      );
      return;
    }

    // Get user ID from customer metadata
    const customer =
      await this.stripeService['stripe'].customers.retrieve(customerId);
    if (customer.deleted || !('metadata' in customer)) {
      this.logger.error(`Customer not found or deleted: ${customerId}`);
      return;
    }

    const userId = customer.metadata?.userId;
    if (!userId) {
      this.logger.error(`Missing userId in customer metadata: ${customerId}`);
      return;
    }

    const numericUserId = Number.parseInt(userId, 10);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      this.logger.error(
        `Invalid userId in customer metadata: ${userId} (session ${session.id})`,
      );
      return;
    }

    try {
      await this.subscriptionService.createSubscriptionFromCheckout(
        numericUserId,
        customerId,
        subscriptionId,
      );
    } catch (e) {
      if (e instanceof SubscriptionUserMissingError) {
        this.logger.error(
          `checkout.session.completed: no DB user for Stripe metadata userId=${numericUserId} session=${session.id} customer=${customerId}`,
        );
        return;
      }
      throw e;
    }

    this.logger.log(`Supporter subscription created for user ${userId}`);

    await this.analytics?.capture(
      numericUserId,
      'subscription_started',
      {
        store: 'stripe',
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency,
      },
      {
        uuid: stableUuid(eventId),
        set: { plan: 'SUPPORTER', store: 'stripe' },
      },
    );

    const user = await this.prisma.user.findUnique({
      where: { userId: numericUserId },
      select: { email: true, firstName: true },
    });

    if (user?.email) {
      const appUrl = this.configService.get('APP_URL');
      this.eventEmitter.emit(
        SendEmailEvent.SLUG,
        new SendEmailEvent({
          type: 'subscription-confirmation',
          to: user.email,
          params: {
            name: user.firstName || undefined,
            subscription_settings_url: `${appUrl}/dashboard/settings?tab=subscription`,
          },
        }),
      );
    }
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
    eventId: string,
  ) {
    try {
      const previous = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
        select: { cancelAtPeriodEnd: true },
      });
      const updated =
        await this.subscriptionService.updateSubscriptionFromWebhook(
          subscription,
        );
      // Also catches cancellations made in the Stripe portal
      if (
        previous &&
        previous.cancelAtPeriodEnd !== updated.cancelAtPeriodEnd
      ) {
        await this.analytics?.capture(
          updated.userId,
          updated.cancelAtPeriodEnd
            ? 'subscription_cancel_scheduled'
            : 'subscription_cancel_reverted',
          { store: 'stripe' },
          { uuid: stableUuid(eventId) },
        );
      }
    } catch (e) {
      if (e instanceof SubscriptionUserMissingError) {
        this.logger.error(
          `customer.subscription.updated: user missing for Stripe subscription ${subscription.id}: ${e.message}`,
        );
        return;
      }
      throw e;
    }
    this.logger.log(`Subscription updated: ${subscription.id}`);
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
    eventId: string,
  ) {
    try {
      const { userId } =
        await this.subscriptionService.updateSubscriptionFromWebhook(
          subscription,
        );
      await this.analytics?.capture(
        userId,
        'subscription_ended',
        { store: 'stripe' },
        { uuid: stableUuid(eventId), set: { plan: 'FREE' } },
      );
    } catch (e) {
      if (e instanceof SubscriptionUserMissingError) {
        this.logger.error(
          `customer.subscription.deleted: user missing for Stripe subscription ${subscription.id}: ${e.message}`,
        );
        return;
      }
      throw e;
    }
    this.logger.log(`Subscription deleted: ${subscription.id}`);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
    this.logger.log(`Invoice paid: ${invoice.id}`);
    // The first invoice is the checkout, already reported
    if (invoice.billing_reason === 'subscription_cycle') {
      await this.reportForCustomer(
        invoice.customer,
        'subscription_renewed',
        eventId,
        { amount: invoice.amount_paid / 100, currency: invoice.currency },
      );
    }
  }

  private async reportForCustomer(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
    event: string,
    eventId: string,
    properties: Record<string, string | number | null>,
  ) {
    const stripeCustomerId =
      typeof customer === 'string' ? customer : customer?.id;
    if (!stripeCustomerId) return;
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId },
      select: { userId: true },
    });
    if (subscription) {
      await this.analytics?.capture(
        subscription.userId,
        event,
        { store: 'stripe', ...properties },
        { uuid: stableUuid(eventId) },
      );
    }
  }
}
