import * as brevo from '@getbrevo/brevo';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ApiEnvSchemaType,
  EmailId,
  EmailLanguage,
  EmailPropsFromId,
  emailLibrary,
} from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { emailTemplates } from '../emails/templates';
import { SendEmail } from '../types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private apiInstance: brevo.TransactionalEmailsApi;
  private apiKey: string;

  constructor(
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private prisma: PrismaService,
  ) {
    this.apiKey = configService.get('BREVO_API_KEY') ?? '';
    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      this.apiKey,
    );
  }

  async sendEmail<T extends EmailId>(payload: SendEmail<T>) {
    try {
      // Get user language from database, default to FR if user not found
      const user = await this.prisma.user.findUnique({
        where: { email: payload.to },
        select: { language: true },
      });

      const language: EmailLanguage = (user?.language ||
        Language.FR) as EmailLanguage;

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: payload.to }];
      sendSmtpEmail.sender = {
        email: this.configService.get('BREVO_FROM_EMAIL'),
      };

      const defaultSubject = emailLibrary[payload.type].defaultSubject;
      const subject = payload.subject || defaultSubject[language];

      const buildHtml = emailTemplates[payload.type] as (
        props: EmailPropsFromId<T> & { language?: EmailLanguage },
      ) => string;
      const htmlContent = buildHtml
        ? buildHtml({ ...payload.params, language })
        : `<p>${subject}</p>`;

      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      this.logger.error(
        `Error sending email: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
