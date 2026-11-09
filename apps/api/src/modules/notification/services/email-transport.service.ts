import { Transporter, createTransport } from 'nodemailer';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_FROM_EMAIL = 'noreply@openathlete.org';
const REQUEST_TIMEOUT_MS = 10_000;

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  /** The same email in plain text, for clients and filters that read it */
  text?: string;
  /** Default: EMAIL_FROM_NAME, else OpenAthlete */
  senderName?: string;
  /** Extra headers, such as List-Unsubscribe */
  headers?: Record<string, string>;
}

const DEFAULT_SENDER_NAME = 'OpenAthlete';

export type EmailTransportKind = 'brevo' | 'smtp';

type ConfigGetter = <K extends keyof ApiEnvSchemaType>(
  key: K,
) => ApiEnvSchemaType[K] | undefined;

/**
 * How this instance sends emails: Brevo when its API key is set, otherwise
 * the SMTP server of SMTP_HOST, otherwise not at all.
 */
export function emailTransportKind(
  get: ConfigGetter,
): EmailTransportKind | undefined {
  if (get('BREVO_API_KEY')) return 'brevo';
  if (get('SMTP_HOST')) return 'smtp';
  return undefined;
}

/**
 * Sends transactional emails through the Brevo HTTP API or an SMTP server.
 *
 * Email is optional: without BREVO_API_KEY or SMTP_HOST (typical for
 * self-hosted instances) sending is disabled and `send` resolves to false.
 */
@Injectable()
export class EmailTransportService {
  private readonly logger = new Logger(EmailTransportService.name);
  private readonly get: ConfigGetter;
  private readonly kind: EmailTransportKind | undefined;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly replyTo: string | undefined;
  private smtp: Transporter | undefined;

  constructor(configService: ConfigService<ApiEnvSchemaType, true>) {
    this.get = (key) => configService.get(key);
    this.kind = emailTransportKind(this.get);
    this.fromEmail =
      this.get('EMAIL_FROM') ||
      this.get('BREVO_FROM_EMAIL') ||
      DEFAULT_FROM_EMAIL;
    this.fromName = this.get('EMAIL_FROM_NAME') || DEFAULT_SENDER_NAME;
    this.replyTo = this.get('EMAIL_REPLY_TO') || undefined;

    if (!this.kind) {
      this.logger.warn(
        'Neither BREVO_API_KEY nor SMTP_HOST is set, emails are disabled',
      );
    }
  }

  isEnabled(): boolean {
    return this.kind !== undefined;
  }

  /**
   * @returns true when the email was accepted, false when email is disabled.
   * @throws when the provider rejects the email.
   */
  async send(email: OutgoingEmail): Promise<boolean> {
    if (this.kind === 'brevo') {
      await this.sendWithBrevo(email);
      return true;
    }
    if (this.kind === 'smtp') {
      await this.smtpTransport().sendMail({
        from: {
          name: email.senderName ?? this.fromName,
          address: this.fromEmail,
        },
        to: email.to,
        replyTo: this.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: email.headers,
      });
      return true;
    }
    return false;
  }

  private async sendWithBrevo(email: OutgoingEmail) {
    const response = await fetch(BREVO_SEND_URL, {
      method: 'POST',
      headers: {
        'api-key': this.get('BREVO_API_KEY')!,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: this.fromEmail,
          name: email.senderName ?? this.fromName,
        },
        to: [{ email: email.to }],
        ...(this.replyTo ? { replyTo: { email: this.replyTo } } : {}),
        subject: email.subject,
        htmlContent: email.html,
        ...(email.text ? { textContent: email.text } : {}),
        ...(email.headers ? { headers: email.headers } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Brevo rejected the email (HTTP ${response.status}): ${body.slice(0, 200)}`,
      );
    }
  }

  private smtpTransport(): Transporter {
    if (!this.smtp) {
      const port = this.get('SMTP_PORT');
      // Implicit TLS on its usual port; elsewhere, STARTTLS when offered
      const secure = this.get('SMTP_SECURE') ?? port === 465;
      const user = this.get('SMTP_USER');
      this.smtp = createTransport({
        host: this.get('SMTP_HOST'),
        port: port ?? (secure ? 465 : 587),
        secure,
        auth: user ? { user, pass: this.get('SMTP_PASSWORD') } : undefined,
        connectionTimeout: REQUEST_TIMEOUT_MS,
        greetingTimeout: REQUEST_TIMEOUT_MS,
        socketTimeout: REQUEST_TIMEOUT_MS,
      });
    }
    return this.smtp;
  }
}
