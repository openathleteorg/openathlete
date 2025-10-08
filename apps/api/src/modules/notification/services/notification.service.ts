import * as brevo from '@getbrevo/brevo';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType, EmailId, emailLibrary } from '@openathlete/shared';

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
      sendSmtpEmail.subject =
        payload.subject || emailLibrary[payload.type].defaultSubject;
      sendSmtpEmail.htmlContent = `<ul>${Object.entries(payload.params)
        .map(([key, value]) => `<li>${key}: ${value}</li>`)
        .join('')}</ul>`;

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: any) {
      console.error('Error sending email', error?.response?.body);
    }
  }
}
