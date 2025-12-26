import Stripe from 'stripe';

import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SubscriptionPlan } from '@openathlete/shared';

import { StripeService } from '../services/stripe.service';
import { SubscriptionService } from '../services/subscription.service';

@ApiTags('Subscription')
@Controller('subscription/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description:
      "Receives and processes webhook events from Stripe. This endpoint verifies the webhook signature using the Stripe webhook secret to ensure the request is authentic and hasn't been tampered with. The raw request body is required for signature verification. After verification, the event is processed based on its type:\n\n" +
      '**Handled Events:**\n' +
      '- `checkout.session.completed`: Creates a subscription in the database after a successful Stripe checkout. Extracts user ID from customer metadata, validates the plan, and creates the subscription record with all billing period information.\n' +
      "- `customer.subscription.updated`: Updates the subscription status, plan, billing periods, trial end date, and cancellation status. The plan is extracted from the subscription's price ID (source of truth) rather than metadata.\n" +
      '- `customer.subscription.deleted`: Marks the subscription as canceled when Stripe deletes it. Updates the subscription status to canceled.\n' +
      '- `invoice.paid`: Logs payment confirmation. Currently only logs the event but can be extended for additional logic (e.g., sending confirmation emails).\n\n' +
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
          await this.handleCheckoutSessionCompleted(session);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionUpdated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionDeleted(subscription);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handleInvoicePaid(invoice);
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

    const planString = session.metadata?.plan;
    if (!planString) {
      this.logger.error(
        `Missing plan in checkout session metadata: ${session.id}`,
      );
      return;
    }

    // Validate that plan is a valid SubscriptionPlan
    const validPlans = Object.values(SubscriptionPlan);
    if (!validPlans.includes(planString as SubscriptionPlan)) {
      this.logger.error(
        `Invalid plan in checkout session metadata: ${planString}`,
      );
      return;
    }

    const plan = planString as SubscriptionPlan;

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

    await this.subscriptionService.createSubscriptionFromCheckout(
      parseInt(userId, 10),
      customerId,
      subscriptionId,
      plan,
    );

    this.logger.log(
      `Subscription created for user ${userId} with plan ${plan}`,
    );
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await this.subscriptionService.updateSubscriptionFromWebhook(subscription);
    this.logger.log(`Subscription updated: ${subscription.id}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // When subscription is deleted, set status to canceled
    await this.subscriptionService.updateSubscriptionFromWebhook(subscription);
    this.logger.log(`Subscription deleted: ${subscription.id}`);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    // Invoice paid events are handled automatically by Stripe
    // We can add additional logic here if needed (e.g., send confirmation email)
    this.logger.log(`Invoice paid: ${invoice.id}`);
  }
}
