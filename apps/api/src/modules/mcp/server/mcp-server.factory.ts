import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { Injectable } from '@nestjs/common';

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

import { McpPrincipal } from '../auth/mcp-auth.service';
import { ToolContext } from './context';
import { SERVER_INSTRUCTIONS, registerPrompts } from './prompts';
import { registerAthleteWriteTools } from './tools/athlete-write.tools';
import { registerAthleteTools } from './tools/athlete.tools';
import { registerCalendarReadTools } from './tools/calendar-read.tools';
import { registerCalendarWriteTools } from './tools/calendar-write.tools';
import { ToolDeps } from './tools/deps';
import { registerLoadTools } from './tools/load.tools';

/**
 * Builds the MCP server of one request. Tools are registered per request
 * for its user: an agent only sees the tools its access allows, so a
 * read-only agent is never offered a write it would be refused.
 */
@Injectable()
export class McpServerFactory {
  private readonly deps: ToolDeps;

  constructor(
    prisma: PrismaService,
    abilities: CaslAbilityFactory,
    events: EventService,
    bulk: EventBulkService,
    series: EventSeriesService,
    cycles: CycleService,
    metrics: MetricService,
    load: TrainingLoadService,
    zones: TrainingZoneService,
    records: RecordService,
  ) {
    this.deps = {
      prisma,
      abilities,
      events,
      bulk,
      series,
      cycles,
      metrics,
      load,
      zones,
      records,
    };
  }

  create(principal: McpPrincipal): McpServer {
    const server = new McpServer(
      {
        name: 'openathlete',
        title: 'OpenAthlete',
        version: '1.0.0',
        websiteUrl: 'https://openathlete.org',
      },
      {
        instructions: SERVER_INSTRUCTIONS,
        capabilities: { tools: {}, prompts: {} },
      },
    );
    const ctx = new ToolContext(principal, this.deps.prisma);
    if (ctx.can('read')) {
      registerAthleteTools(server, ctx, this.deps);
      registerCalendarReadTools(server, ctx, this.deps);
      registerLoadTools(server, ctx, this.deps);
    }
    if (ctx.can('write')) {
      registerCalendarWriteTools(server, ctx, this.deps);
      registerAthleteWriteTools(server, ctx, this.deps);
    }
    registerPrompts(server, ctx.can('write'));
    return server;
  }
}
