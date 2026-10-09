import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { HttpException, Logger } from '@nestjs/common';

import { McpScope } from '@openathlete/shared';

import { validTimeZone, zonedClock } from 'src/common/utils/time-zone';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { McpPrincipal } from '../auth/mcp-auth.service';

/** A failure the agent can act on: its message says what to do instead */
export class ToolError extends Error {}

/** The athlete a tool works on, with what dates are read in */
export type AthleteScope = {
  athleteId: number;
  name: string;
  timeZone: string;
  /** Today, in the athlete's time zone (YYYY-MM-DD) */
  today: string;
  isSelf: boolean;
};

const logger = new Logger('McpTools');

export const athleteIdInput = z
  .number()
  .int()
  .positive()
  .optional()
  .describe(
    'Athlete to work on. Omit for yourself; coaches pass one of the ids of list_athletes',
  );

/** What every tool of a request shares: who acts and on which athletes */
export class ToolContext {
  constructor(
    readonly principal: McpPrincipal,
    private readonly prisma: PrismaService,
  ) {}

  get user() {
    return this.principal.user;
  }

  can(scope: McpScope) {
    return this.principal.scopes.includes(scope);
  }

  /** Athletes the user may work on: themselves, then those they coach */
  get athleteIds(): number[] {
    const { athlete, coachAthletes } = this.principal.user;
    return [
      ...(athlete ? [athlete.athleteId] : []),
      ...(coachAthletes ?? []).map((coached) => coached.athleteId),
    ];
  }

  async athlete(athleteId?: number): Promise<AthleteScope> {
    const own = this.principal.user.athlete?.athleteId;
    const coached = (this.principal.user.coachAthletes ?? []).map(
      (entry) => entry.athleteId,
    );
    const id =
      athleteId ?? own ?? (coached.length === 1 ? coached[0] : undefined);
    if (!id) {
      throw new ToolError(
        coached.length
          ? 'You coach several athletes: pass athleteId (see list_athletes).'
          : 'This account has no athlete profile and coaches nobody yet.',
      );
    }
    if (!this.athleteIds.includes(id)) {
      throw new ToolError(
        `No access to athlete ${id}: list_athletes shows the athletes you can work on.`,
      );
    }
    const athlete = await this.prisma.athlete.findUniqueOrThrow({
      where: { athleteId: id },
      select: {
        athleteId: true,
        user: { select: { firstName: true, lastName: true, timeZone: true } },
      },
    });
    const timeZone = validTimeZone(athlete.user.timeZone);
    return {
      athleteId: id,
      name: `${athlete.user.firstName} ${athlete.user.lastName}`.trim(),
      timeZone,
      today: zonedClock(new Date(), timeZone).date,
      isSelf: id === own,
    };
  }

  /** The athlete of an event the user can read, or a ToolError */
  async athleteOfEvent(eventId: number): Promise<AthleteScope> {
    const event = await this.prisma.event.findUnique({
      where: { eventId },
      select: { athleteId: true },
    });
    if (!event?.athleteId || !this.athleteIds.includes(event.athleteId)) {
      throw new ToolError(
        `Event ${eventId} not found: get_calendar lists the events and their ids.`,
      );
    }
    return this.athlete(event.athleteId);
  }
}

/** The error message of an HTTP exception thrown by a service */
function httpMessage(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join('; ');
  if (typeof message === 'string') return message;
  return error.message;
}

/**
 * Runs a tool: its result goes out both as structured content (checked
 * against the output schema, which also drops internal fields) and as JSON
 * text for clients that only read text. Failures become error results the
 * agent can read and correct, never protocol errors.
 */
export async function run<T extends z.ZodTypeAny>(
  output: T,
  handler: () => Promise<z.input<T>>,
): Promise<CallToolResult> {
  try {
    const result = output.parse(await handler()) as Record<string, unknown>;
    return {
      structuredContent: result,
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    let message: string;
    if (error instanceof ToolError) {
      message = error.message;
    } else if (error instanceof HttpException) {
      message = httpMessage(error);
    } else {
      logger.error(
        `Tool failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      message = 'Internal error: try again, or report it if it persists.';
    }
    return { isError: true, content: [{ type: 'text', text: message }] };
  }
}
