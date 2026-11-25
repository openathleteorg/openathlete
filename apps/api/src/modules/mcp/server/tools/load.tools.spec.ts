import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { GARMIN_ATTRIBUTION } from '../presenters';
import { registerLoadTools } from './load.tools';

describe('MCP metric history', () => {
  it('returns stored precision, zero and signed values with their dates and notes', async () => {
    const tools: Record<string, (args: unknown) => Promise<CallToolResult>> =
      {};
    const server = {
      registerTool: (
        name: string,
        _config: unknown,
        handler: (typeof tools)[string],
      ) => {
        tools[name] = handler;
      },
    };
    const values = [0.06123456789, 0, -0.123456789];
    const findMany = jest.fn().mockResolvedValue(
      values.map((value) => ({
        type: 'SKIN_TEMP_DEVIATION',
        value,
        date: new Date('2026-01-01T00:00:00Z'),
        notes: 'Original measurement',
      })),
    );
    const ctx = {
      athlete: jest.fn().mockResolvedValue({
        athleteId: 42,
        today: '2026-01-02',
        timeZone: 'UTC',
      }),
    };
    registerLoadTools(
      server as never,
      ctx as never,
      { prisma: { athleteMetric: { findMany } } } as never,
    );
    const result = await tools.get_metrics({
      types: ['SKIN_TEMP_DEVIATION'],
      from: '2026-01-01',
      to: '2026-01-02',
    });
    expect(result.isError).toBeUndefined();
    const series = result.structuredContent?.series as { values: unknown[] }[];
    expect(series[0].values).toEqual(
      values.map((value) => ({
        date: '2026-01-01',
        value,
        notes: 'Original measurement',
      })),
    );
    expect(findMany.mock.calls[0][0].where.athleteId).toBe(42);
    expect(JSON.parse((result.content[0] as { text: string }).text)).toEqual(
      result.structuredContent,
    );
  });

  it('attributes Garmin values and leaves manual ones plain', async () => {
    const tools: Record<string, (args: unknown) => Promise<CallToolResult>> =
      {};
    const server = {
      registerTool: (
        name: string,
        _config: unknown,
        handler: (typeof tools)[string],
      ) => {
        tools[name] = handler;
      },
    };
    const date = new Date('2026-01-01T00:00:00Z');
    const findMany = jest.fn().mockResolvedValue([
      { type: 'WEIGHT', value: 70, date, notes: null, source: 'GARMIN' },
      { type: 'WEIGHT', value: 71, date, notes: null, source: 'MANUAL' },
    ]);
    const ctx = {
      athlete: jest.fn().mockResolvedValue({
        athleteId: 42,
        today: '2026-01-02',
        timeZone: 'UTC',
      }),
    };
    registerLoadTools(
      server as never,
      ctx as never,
      { prisma: { athleteMetric: { findMany } } } as never,
    );
    const result = await tools.get_metrics({
      types: ['WEIGHT'],
      from: '2026-01-01',
      to: '2026-01-02',
    });
    const series = result.structuredContent?.series as {
      values: Record<string, unknown>[];
    }[];
    expect(series[0].values[0]).toMatchObject({
      source: 'Garmin',
      attribution: GARMIN_ATTRIBUTION,
    });
    expect(series[0].values[1]).not.toHaveProperty('source');
    expect(series[0].values[1]).not.toHaveProperty('attribution');
  });
});
