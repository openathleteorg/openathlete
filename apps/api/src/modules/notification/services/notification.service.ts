import { Injectable, Logger } from '@nestjs/common';

import {
  EmailId,
  EmailLanguage,
  EmailPropsFromId,
  emailLibrary,
} from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { RenderedEmail } from '../emails/core/layout';
import { emailTemplates } from '../emails/templates';
import { SendEmail } from '../types';
import { EmailTransportService } from './email-transport.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailTransport: EmailTransportService,
    private readonly prisma: PrismaService,
  ) {}

  async sendEmail<T extends EmailId>(payload: SendEmail<T>) {
    if (!this.emailTransport.isEnabled()) {
      return;
    }

    try {
      // The recipient's saved language; for someone without an account, the
      // payload's (e.g. the inviter's); else FR
      const user = await this.prisma.user.findUnique({
        where: { email: payload.to },
        select: { language: true },
      });

      const language: EmailLanguage =
        user?.language ?? payload.language ?? Language.FR;

      const defaultSubject = emailLibrary[payload.type].defaultSubject;
      const subject = payload.subject || defaultSubject[language];

      const build = emailTemplates[payload.type] as (
        props: EmailPropsFromId<T> & { language?: EmailLanguage },
      ) => RenderedEmail;
      const { html, text } = build({ ...payload.params, language });

      await this.emailTransport.send({ to: payload.to, subject, html, text });
    } catch (error) {
      this.logger.error(
        `Error sending email: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
