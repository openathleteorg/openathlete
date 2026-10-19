import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { registerAthleteWriteTools } from './athlete-write.tools';

function setup() {
  const tools: Record<
    string,
    {
      schema: z.ZodTypeAny;
      handler: (args: unknown) => Promise<CallToolResult>;
    }
  > = {};
  const server = {
    registerTool: (
      name: string,
      config: { inputSchema: z.ZodRawShape },
      handler: (typeof tools)[string]['handler'],
    ) => {
      tools[name] = { schema: z.object(config.inputSchema), handler };
    },
  };
  const createMetric = jest.fn(async (_user, entry) => entry);
  const ctx = {
    user: { userId: 7 },
    athlete: jest
      .fn()
      .mockResolvedValue({ athleteId: 42, today: '2026-01-02' }),
  };
  registerAthleteWriteTools(
    server as never,
    ctx as never,
    { metrics: { createMetric } } as never,
  );
  return {
    createMetric,
    call: (type: string, value: number, date = '2026-01-01') => {
      const args = tools.log_metrics.schema.parse({
        entries: [{ type, value, date }],
      });
      return tools.log_metrics.handler(args);
    },
  };
}

describe('MCP metric values', () => {
  it.each([
    'DAILY_STEPS',
    'DAILY_ACTIVE_CALORIES',
    'SLEEP_DEEP_DURATION',
    'NAP_DURATION',
    'SLEEP_SCORE',
    'SKIN_TEMP_DEVIATION',
  ])('accepts a genuine zero for %s', async (type) => {
    const s = setup();
    expect((await s.call(type, 0)).isError).toBeUndefined();
    expect(s.createMetric).toHaveBeenCalledWith(
      { userId: 7 },
      expect.objectContaining({ type, value: 0 }),
      42,
    );
  });

  it('preserves a negative temperature deviation', async () => {
    const s = setup();
    expect(
      (await s.call('SKIN_TEMP_DEVIATION', -0.123456)).isError,
    ).toBeUndefined();
    expect(s.createMetric).toHaveBeenCalledWith(
      { userId: 7 },
      expect.objectContaining({ value: -0.123456 }),
      42,
    );
  });

  it.each([
    ['WEIGHT', 0],
    ['HR_REST', 0],
    ['DAILY_STEPS', -1],
    ['SLEEP_DEEP_DURATION', -1],
  ])('refuses invalid %s value %s before saving', async (type, value) => {
    const s = setup();
    expect((await s.call(type as string, value as number)).isError).toBe(true);
    expect(s.createMetric).not.toHaveBeenCalled();
  });

  it.each([NaN, Infinity, -Infinity])(
    'rejects non-finite values at the input boundary: %s',
    (value) => {
      const s = setup();
      expect(() => s.call('WEIGHT', value)).toThrow();
      expect(s.createMetric).not.toHaveBeenCalled();
    },
  );

  it('continues to reject future dates', async () => {
    const s = setup();
    expect((await s.call('DAILY_STEPS', 0, '2999-01-01')).isError).toBe(true);
    expect(s.createMetric).not.toHaveBeenCalled();
  });
});
