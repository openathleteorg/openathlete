import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { maskEmail } from 'src/common/utils/mask-email';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const RESEND_API = 'https://api.resend.com';
const REQUEST_TIMEOUT_MS = 10_000;
// Resend allows 10 requests per second per account, shared with other projects
const REQUEST_INTERVAL_MS = 250;

export interface SyncSummary {
  total: number;
  synced: number;
  failed: number;
}

/**
 * Keeps the people who agreed to receive news (`emailNewsConsentAt`) as
 * contacts of a Resend segment, so the news emails can be sent from there.
 *
 * Off without RESEND_API_KEY and RESEND_NEWS_SEGMENT_ID. It never blocks what
 * the user does: a Resend failure is logged and swallowed.
 */
@Injectable()
export class ResendContactsService {
  private readonly logger = new Logger(ResendContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  isEnabled(): boolean {
    return Boolean(
      this.config.get('RESEND_API_KEY') &&
      this.config.get('RESEND_NEWS_SEGMENT_ID'),
    );
  }

  /** Aligns the contact of this user with their consent */
  async sync(userId: number): Promise<boolean> {
    if (!this.isEnabled()) return false;
    try {
      const user = await this.prisma.user.findUnique({
        where: { userId },
        select: {
          email: true,
          language: true,
          firstName: true,
          emailNewsConsentAt: true,
          coachAthletes: { select: { athleteId: true }, take: 1 },
        },
      });
      if (!user) return false;
      if (user.emailNewsConsentAt) {
        await this.upsert(user.email, {
          firstName: user.firstName,
          language: user.language,
          role: user.coachAthletes.length > 0 ? 'coach' : 'athlete',
        });
      } else {
        await this.unsubscribe(user.email);
      }
      return true;
    } catch (error) {
      this.logger.warn(`Could not sync a Resend contact: ${String(error)}`);
      return false;
    }
  }

  /** For a deleted account: the contact goes with it */
  async remove(email: string): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      const response = await this.request(
        'DELETE',
        `/contacts/${encodeURIComponent(email)}`,
      );
      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not remove the Resend contact ${maskEmail(email)}: ${String(error)}`,
      );
    }
  }

  /** The initial sync, safe to run again: every consenting account is upserted */
  async syncAll(
    progress?: (summary: SyncSummary) => void,
  ): Promise<SyncSummary> {
    const users = await this.prisma.user.findMany({
      where: { emailNewsConsentAt: { not: null } },
      select: { userId: true },
      orderBy: { userId: 'asc' },
    });
    const summary: SyncSummary = { total: users.length, synced: 0, failed: 0 };
    for (const { userId } of users) {
      if (await this.sync(userId)) summary.synced++;
      else summary.failed++;
      progress?.(summary);
    }
    return summary;
  }

  private async upsert(
    email: string,
    contact: { firstName: string | null; language: string; role: string },
  ) {
    const properties = { language: contact.language, role: contact.role };
    const path = `/contacts/${encodeURIComponent(email)}`;
    const update = await this.request('PATCH', path, {
      unsubscribed: false,
      ...(contact.firstName ? { first_name: contact.firstName } : {}),
      properties,
    });
    if (update.ok) {
      // Already known to Resend: make sure it sits in the news segment
      await this.addToSegment(path);
      return;
    }
    if (update.status !== 404) throw new Error(`HTTP ${update.status}`);

    const create = await this.request('POST', '/contacts', {
      email,
      unsubscribed: false,
      ...(contact.firstName ? { first_name: contact.firstName } : {}),
      properties,
      segments: [{ id: this.config.get('RESEND_NEWS_SEGMENT_ID') }],
    });
    if (!create.ok) throw new Error(`HTTP ${create.status}`);
  }

  private async unsubscribe(email: string) {
    const response = await this.request(
      'PATCH',
      `/contacts/${encodeURIComponent(email)}`,
      { unsubscribed: true },
    );
    // Never a contact: nothing to unsubscribe
    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  private async addToSegment(contactPath: string) {
    const response = await this.request(
      'POST',
      `${contactPath}/segments/${this.config.get('RESEND_NEWS_SEGMENT_ID')}`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }

  private nextSlot = 0;

  private async request(method: string, path: string, body?: unknown) {
    const slot = Math.max(Date.now(), this.nextSlot);
    this.nextSlot = slot + REQUEST_INTERVAL_MS;
    const wait = slot - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    return fetch(`${RESEND_API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.config.get('RESEND_API_KEY')}`,
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }
}
