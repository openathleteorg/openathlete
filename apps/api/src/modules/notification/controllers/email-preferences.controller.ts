import {
  BadRequestException,
  Controller,
  HttpCode,
  Optional,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  EmailList,
  readUnsubscribeToken,
} from '../lifecycle/unsubscribe-token';
import { ResendContactsService } from '../services/resend-contacts.service';

/** The account setting each list of emails turns on */
function preference(list: EmailList, subscribed: boolean) {
  switch (list) {
    case 'tips':
      return { emailTips: subscribed };
    case 'recap':
      return { emailRecap: subscribed };
    case 'news':
      return { emailNewsConsentAt: subscribed ? new Date() : null };
    case 'questionnaires':
      return { emailQuestionnaires: subscribed };
    case 'weekly':
      return { emailWeekly: subscribed };
    case 'coach_weekly':
      return { emailCoachWeekly: subscribed };
  }
}

/**
 * The links at the foot of the emails: they work without signing in, from
 * the token they carry.
 */
@ApiTags('Emails')
@Controller('emails')
export class EmailPreferencesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
    @Optional() private readonly analytics?: AnalyticsService,
    @Optional() private readonly resendContacts?: ResendContactsService,
  ) {}

  @Post('unsubscribe')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Stop one kind of email',
    description:
      'Turns off the list of emails the token was made for. Mail clients call it directly for one-click unsubscribe (RFC 8058), and the unsubscribe page of the web app on confirmation.',
  })
  @ApiQuery({ name: 'token', description: 'Token from the email' })
  @ApiResponse({ status: 200, description: 'The list is turned off' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  unsubscribe(@Query('token') token: string) {
    return this.set(token, false);
  }

  @Post('resubscribe')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive one kind of email again',
    description:
      'Undoes an unsubscribe from the same token, when the person changes their mind on the unsubscribe page.',
  })
  @ApiQuery({ name: 'token', description: 'Token from the email' })
  @ApiResponse({ status: 200, description: 'The list is turned on' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  resubscribe(@Query('token') token: string) {
    return this.set(token, true);
  }

  private async set(token: string | undefined, subscribed: boolean) {
    const read = token
      ? readUnsubscribeToken(this.config.get('JWT_SECRET_KEY'), token)
      : null;
    if (!read) throw new BadRequestException('Invalid token');

    // A deleted account has nothing left to unsubscribe from
    const { count } = await this.prisma.user.updateMany({
      where: { userId: read.userId },
      data: preference(read.list, subscribed),
    });
    // How many leave the Monday email, next to how many it brings back
    if (count > 0 && !subscribed && read.list === 'weekly') {
      await this.analytics?.capture(read.userId, 'weekly_email_unsubscribed', {
        from: 'email',
      });
    }
    if (count > 0 && read.list === 'news') {
      void this.resendContacts?.sync(read.userId);
    }
    return { list: read.list, subscribed };
  }
}
