import { Injectable, InternalServerErrorException } from '@nestjs/common';

import type { ContactSubmissionDto } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async submit(
    body: ContactSubmissionDto,
    meta?: { ip?: string; userAgent?: string },
  ) {
    try {
      await this.prisma.contact_submission.create({
        data: {
          name: body.name,
          email: body.email,
          goal: body.goal ?? null,
          message: body.message,
          ip: meta?.ip ?? null,
          user_agent: meta?.userAgent ?? null,
        },
      });
    } catch {}

    // Forward to Notion
    const token = process.env.NOTION_TOKEN as string | undefined;
    const databaseId = process.env.NOTION_DATABASE_ID as string | undefined;
    if (!token || !databaseId) return; // silently skip if not configured in dev

    try {
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            Name: {
              title: [
                {
                  text: { content: `${body.name} – ${body.email}` },
                },
              ],
            },
            Email: { email: body.email },
            Goal: body.goal
              ? { rich_text: [{ text: { content: body.goal } }] }
              : undefined,
            Message: { rich_text: [{ text: { content: body.message } }] },
            Source: { select: { name: 'Website' } },
          },
        }),
      });
    } catch (e) {
      throw new InternalServerErrorException('Failed to forward to Notion');
    }
  }
}
