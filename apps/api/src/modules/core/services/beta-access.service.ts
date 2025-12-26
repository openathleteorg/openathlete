import * as brevo from '@getbrevo/brevo';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { BetaAccessRequestDto } from '@openathlete/shared';
import { ApiEnvSchemaType } from '@openathlete/shared';

@Injectable()
export class BetaAccessService {
  private readonly logger = new Logger(BetaAccessService.name);
  private apiInstance: brevo.TransactionalEmailsApi;
  private apiKey: string;
  private fromEmail: string;

  constructor(private configService: ConfigService<ApiEnvSchemaType, true>) {
    this.apiKey = configService.get('BREVO_API_KEY') ?? '';
    this.fromEmail =
      configService.get('BREVO_FROM_EMAIL') ?? 'noreply@openathlete.org';
    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      this.apiKey,
    );
  }

  async request(
    body: BetaAccessRequestDto,
    meta?: { ip?: string; userAgent?: string },
  ) {
    // Send email to tristan@tblt.fr
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: 'tristan@tblt.fr' }];
      sendSmtpEmail.sender = {
        email: this.fromEmail,
        name: 'OpenAthlete',
      };
      sendSmtpEmail.subject = `Nouvelle demande d'accès bêta - ${body.name}`;
      sendSmtpEmail.htmlContent = `
        <h2>Nouvelle demande d'accès bêta</h2>
        <p><strong>Nom:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Type:</strong> ${body.type === 'coach' ? 'Coach' : 'Club'}</p>
        <p><strong>Nombre d'athlètes:</strong> ${body.athletes}</p>
        ${body.message ? `<p><strong>Message:</strong></p><p>${body.message.replace(/\n/g, '<br>')}</p>` : ''}
        ${meta?.ip ? `<p><strong>IP:</strong> ${meta.ip}</p>` : ''}
        ${meta?.userAgent ? `<p><strong>User Agent:</strong> ${meta.userAgent}</p>` : ''}
      `;

      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorResponse = (error as { response?: { body?: unknown } })?.response?.body;
      this.logger.error(
        `Error sending beta access request email: ${errorMessage}${errorResponse ? ` - Response: ${JSON.stringify(errorResponse)}` : ''}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
