import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Optional,
  Post,
  RawBodyRequest,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { maskEmail } from 'src/common/utils/mask-email';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { verifySvixSignature } from '../helpers/svix-signature';
import { ResendContactsService } from '../services/resend-contacts.service';

interface ResendEvent {
  type?: string;
  data?: {
    email?: string;
    to?: string[];
    unsubscribed?: boolean;
    bounce?: { type?: string };
    tags?: Record<string, string> | { name: string; value: string }[];
  };
}

/** The lists a spam complaint turns off: every optional one */
const COMPLAINT_DATA = {
  emailTips: false,
  emailRecap: false,
  emailWeekly: false,
  emailCoachWeekly: false,
  emailNewsConsentAt: null,
};

@ApiTags('Emails')
@SkipThrottle()
@Controller('webhooks/resend')
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
    @Optional() private readonly analytics?: AnalyticsService,
    @Optional() private readonly resendContacts?: ResendContactsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend webhook endpoint',
    description:
      'Receives the events of Resend, signed with Svix.\n\n' +
      '**Handled events:**\n' +
      '- `email.complained`: turns off every optional list of the person and records a PostHog event.\n' +
      '- `email.bounced` (permanent): records a PostHog event; Resend already blocks the address.\n' +
      '- `contact.updated` with `unsubscribed: true`: clears the news consent of the person.\n\n' +
      '**Security:** the Svix signature is verified with `RESEND_WEBHOOK_SECRET`; 503 when it is not set.',
  })
  @ApiHeader({ name: 'svix-id', required: true })
  @ApiHeader({ name: 'svix-timestamp', required: true })
  @ApiHeader({ name: 'svix-signature', required: true })
  @ApiResponse({ status: 200, description: 'Event received' })
  @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
  @ApiResponse({ status: 503, description: 'Webhook secret not configured' })
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') id?: string,
    @Headers('svix-timestamp') timestamp?: string,
    @Headers('svix-signature') signature?: string,
  ) {
    const secret = this.config.get('RESEND_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Resend webhook is not configured');
    }
    const rawBody = req.rawBody;
    if (
      !rawBody ||
      !verifySvixSignature(secret, rawBody, { id, timestamp, signature })
    ) {
      throw new BadRequestException('Invalid signature');
    }

    let event: ResendEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as ResendEvent;
    } catch {
      throw new BadRequestException('Invalid payload');
    }

    switch (event.type) {
      case 'email.complained':
        for (const to of event.data?.to ?? []) await this.complained(to);
        break;
      case 'email.bounced':
        if (event.data?.bounce?.type === 'Permanent') {
          for (const to of event.data.to ?? []) await this.bounced(to, event);
        }
        break;
      case 'contact.updated':
        if (event.data?.unsubscribed === true && event.data.email) {
          await this.unsubscribedFromNews(event.data.email);
        }
        break;
    }
    return { received: true };
  }

  private findUser(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { userId: true },
    });
  }

  private async complained(email: string) {
    const user = await this.findUser(email);
    if (!user) return;
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: COMPLAINT_DATA,
    });
    // The news contact must stop too, or a broadcast would still reach them
    await this.resendContacts?.sync(user.userId);
    this.logger.warn(`Spam complaint from ${maskEmail(email)}: lists off`);
    await this.analytics?.capture(user.userId, 'email_complained');
  }

  private async bounced(email: string, event: ResendEvent) {
    const user = await this.findUser(email);
    if (!user) return;
    this.logger.warn(`Permanent bounce for ${maskEmail(email)}`);
    await this.analytics?.capture(user.userId, 'email_bounced', {
      bounce_type: event.data?.bounce?.type,
    });
  }

  private async unsubscribedFromNews(email: string) {
    await this.prisma.user.updateMany({
      where: {
        email: { equals: email, mode: 'insensitive' },
        emailNewsConsentAt: { not: null },
      },
      data: { emailNewsConsentAt: null },
    });
  }
}
