import { Transporter, createTransport } from 'nodemailer';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

const RESEND_SEND_URL = 'https://api.resend.com/emails';
const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_FROM_EMAIL = 'noreply@openathlete.org';
const REQUEST_TIMEOUT_MS = 10_000;
// Resend allows 10 requests per second for the whole account, shared with
// other projects: the bulk Monday emails stay well under it
const RESEND_MIN_INTERVAL_MS = 250;
const RESEND_MAX_RETRIES = 3;
const RESEND_DEFAULT_RETRY_MS = 1_000;
const RESEND_MAX_RETRY_MS = 30_000;

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
  /** The kind of email (password_reset, weekly_recap...), to read sends by type */
  kind?: string;
  /** Stable id of this send, so that a retry never sends it twice (Resend) */
  idempotencyKey?: string;
}

const DEFAULT_SENDER_NAME = 'OpenAthlete';

export type EmailTransportKind = 'resend' | 'brevo' | 'smtp';

type ConfigGetter = <K extends keyof ApiEnvSchemaType>(
  key: K,
) => ApiEnvSchemaType[K] | undefined;

/**
 * How this instance sends emails: Resend when its API key is set, otherwise
 * Brevo (deprecated), otherwise the SMTP server of SMTP_HOST, otherwise not
 * at all.
 */
export function emailTransportKind(
  get: ConfigGetter,
): EmailTransportKind | undefined {
  if (get('RESEND_API_KEY')) return 'resend';
  if (get('BREVO_API_KEY')) return 'brevo';
  if (get('SMTP_HOST')) return 'smtp';
  return undefined;
}

/**
 * Sends transactional emails through the Resend or Brevo HTTP API, or an
 * SMTP server.
 *
 * Email is optional: without RESEND_API_KEY, BREVO_API_KEY or SMTP_HOST (typical for
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
  /** When the next Resend request may leave, to space them out */
  private resendNextSlot = 0;

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
        'None of RESEND_API_KEY, BREVO_API_KEY or SMTP_HOST is set, emails are disabled',
      );
    } else if (this.kind === 'brevo') {
      this.logger.warn(
        'Sending through Brevo is deprecated and will be removed: set RESEND_API_KEY instead',
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
    if (this.kind === 'resend') {
      await this.sendWithResend(email);
      return true;
    }
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

  private async sendWithResend(email: OutgoingEmail) {
    const from = `${(email.senderName ?? this.fromName).replace(/["<>]/g, '')} <${this.fromEmail}>`;
    const kind = email.kind?.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 256);
    const body = JSON.stringify({
      from,
      to: [email.to],
      ...(this.replyTo ? { reply_to: this.replyTo } : {}),
      subject: email.subject,
      html: email.html,
      ...(email.text ? { text: email.text } : {}),
      ...(email.headers ? { headers: email.headers } : {}),
      ...(kind ? { tags: [{ name: 'kind', value: kind }] } : {}),
    });

    for (let attempt = 0; ; attempt++) {
      await this.waitForResendSlot();
      const response = await fetch(RESEND_SEND_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.get('RESEND_API_KEY')!}`,
          'content-type': 'application/json',
          ...(email.idempotencyKey
            ? { 'idempotency-key': email.idempotencyKey }
            : {}),
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) return;

      if (response.status === 429 && attempt < RESEND_MAX_RETRIES) {
        const seconds = Number(response.headers.get('retry-after'));
        const delay =
          Number.isFinite(seconds) && seconds > 0
            ? Math.min(seconds * 1000, RESEND_MAX_RETRY_MS)
            : RESEND_DEFAULT_RETRY_MS;
        this.resendNextSlot = Math.max(this.resendNextSlot, Date.now() + delay);
        continue;
      }
      const text = await response.text().catch(() => '');
      throw new Error(
        `Resend rejected the email (HTTP ${response.status}): ${text.slice(0, 200)}`,
      );
    }
  }

  /** Reserves the next slot, one every RESEND_MIN_INTERVAL_MS at most */
  private async waitForResendSlot() {
    const slot = Math.max(Date.now(), this.resendNextSlot);
    this.resendNextSlot = slot + RESEND_MIN_INTERVAL_MS;
    const wait = slot - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
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
