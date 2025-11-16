import * as brevo from '@getbrevo/brevo';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ApiEnvSchemaType,
  EmailId,
  EmailPropsFromId,
  emailLibrary,
} from '@openathlete/shared';

import { emailTemplates } from '../emails/templates';
import { SendEmail } from '../types';

@Injectable()
export class NotificationService {
  private apiInstance: brevo.TransactionalEmailsApi;
  private apiKey: string;

  constructor(private configService: ConfigService<ApiEnvSchemaType, true>) {
    this.apiKey = configService.get('BREVO_API_KEY') ?? '';
    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      this.apiKey,
    );
  }

  async sendEmail<T extends EmailId>(payload: SendEmail<T>) {
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: payload.to }];
      sendSmtpEmail.sender = {
        email: this.configService.get('BREVO_FROM_EMAIL'),
      };

      const subject =
        payload.subject || emailLibrary[payload.type].defaultSubject;

      const buildHtml = emailTemplates[payload.type] as (
        props: EmailPropsFromId<T>,
      ) => string;
      const htmlContent = buildHtml
        ? buildHtml(payload.params)
        : `<p>${subject}</p>`;

      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error('Error sending email', error);
    }
  }
}
