import {
  VerificationException,
  VerificationStatus,
} from '@apple/app-store-server-library';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import {
  AppleNotificationDto,
  appleNotificationDtoSchema,
} from '@openathlete/shared';

import {
  AppleStoreService,
  VerifiedAppleNotification,
} from '../apple/apple-store.service';
import { SubscriptionService } from '../services/subscription.service';

@ApiTags('Subscription')
@SkipThrottle()
@Controller('subscription/apple/notifications')
export class AppleNotificationsController {
  private readonly logger = new Logger(AppleNotificationsController.name);

  constructor(
    private readonly appleStoreService: AppleStoreService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'App Store Server Notifications V2',
    description:
      "Receives Apple's notifications about App Store subscriptions (renewals, cancellations, billing problems, expirations, refunds), set as the production and sandbox URL in App Store Connect. The signed payload is checked against Apple's root certificate, then the subscription it names is updated. Notifications about purchases the iOS app has not recorded yet are acknowledged and skipped: the app records them.",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { signedPayload: { type: 'string' } },
      required: ['signedPayload'],
    },
  })
  @ApiResponse({ status: 200, description: 'Notification processed' })
  @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
  @ApiResponse({
    status: 503,
    description:
      'App Store purchases are off, or the certificates could not be checked (Apple retries)',
  })
  async handleNotification(
    @Body(new ZodValidationPipe(appleNotificationDtoSchema))
    dto: AppleNotificationDto,
  ): Promise<{ received: true }> {
    if (!this.appleStoreService.enabled) {
      throw new ServiceUnavailableException('APP_STORE_PURCHASES_DISABLED');
    }

    let verified: VerifiedAppleNotification;
    try {
      verified = await this.appleStoreService.verifyNotification(
        dto.signedPayload,
      );
    } catch (error) {
      if (!(error instanceof VerificationException)) throw error;
      this.logger.warn(
        `Rejected App Store notification: verification status ${error.status}`,
      );
      // A non-2xx answer makes Apple retry, which helps only when the
      // failure was Apple's OCSP responder being unreachable
      if (error.status === VerificationStatus.RETRYABLE_VERIFICATION_FAILURE) {
        throw new ServiceUnavailableException('APPLE_VERIFICATION_UNAVAILABLE');
      }
      throw new BadRequestException('INVALID_APPLE_NOTIFICATION');
    }

    const { notification, transaction, renewalInfo } = verified;
    this.logger.log(
      `App Store notification ${notification.notificationType}${notification.subtype ? `/${notification.subtype}` : ''} (${notification.data?.environment ?? 'no environment'})`,
    );
    if (transaction) {
      const subscription =
        await this.subscriptionService.applyAppleNotification(
          transaction,
          renewalInfo,
        );
      if (!subscription) {
        this.logger.log(
          `No subscription linked to App Store transaction ${transaction.originalTransactionId} yet`,
        );
      }
    }
    return { received: true };
  }
}
