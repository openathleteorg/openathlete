import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  CallToolResult,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { CaslAbilityFactory } from 'src/modules/auth';
import { CycleService } from 'src/modules/core/services/cycle.service';
import { EventBulkService } from 'src/modules/core/services/event-bulk.service';
import { EventSeriesService } from 'src/modules/core/services/event-series.service';
import { EventService } from 'src/modules/core/services/event.service';
import { MetricService } from 'src/modules/core/services/metric.service';
import { RecordService } from 'src/modules/core/services/record.service';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { TrainingZoneService } from 'src/modules/core/services/training-zone.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ToolContext } from '../context';

/** The services tools call: writes go through them, with their checks */
export type ToolDeps = {
  prisma: PrismaService;
  abilities: CaslAbilityFactory;
  events: EventService;
  bulk: EventBulkService;
  series: EventSeriesService;
  cycles: CycleService;
  metrics: MetricService;
  load: TrainingLoadService;
  zones: TrainingZoneService;
  records: RecordService;
};

export type ToolRegistrar = (
  server: McpServer,
  ctx: ToolContext,
  deps: ToolDeps,
) => void;

/**
 * server.registerTool, typed by our own schemas. The SDK's generic
 * signature infers through every zod schema it is given, which exhausts the
 * TypeScript compiler on schemas as rich as these.
 */
export function registerTool<Shape extends z.ZodRawShape>(
  server: McpServer,
  name: string,
  config: {
    title: string;
    description: string;
    inputSchema: Shape;
    outputSchema: z.ZodTypeAny;
    annotations: ToolAnnotations;
  },
  handler: (args: z.output<z.ZodObject<Shape>>) => Promise<CallToolResult>,
) {
  (server.registerTool as (...args: unknown[]) => unknown).call(
    server,
    name,
    config,
    handler,
  );
}

/** Tools that only read the user's data */
export const READ_ONLY = {
  readOnlyHint: true,
  openWorldHint: false,
} as const;

/** Names of zone ids, to show them in workouts */
export async function zoneNamesOf(
  deps: ToolDeps,
  athleteId: number,
): Promise<Map<number, string>> {
  const zones = await deps.prisma.trainingZone.findMany({
    where: { athleteId },
    select: { trainingZoneId: true, name: true, type: true },
  });
  return new Map(
    zones.map((zone) => [
      zone.trainingZoneId,
      `${zone.name} (${zone.type.toLowerCase()})`,
    ]),
  );
}
