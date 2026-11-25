import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ToolContext } from './context';
import { registerAthleteWriteTools } from './tools/athlete-write.tools';
import { registerAthleteTools } from './tools/athlete.tools';
import { registerCalendarReadTools } from './tools/calendar-read.tools';
import { registerCalendarWriteTools } from './tools/calendar-write.tools';
import type { ToolDeps } from './tools/deps';
import { registerExerciseTools } from './tools/exercise.tools';
import { registerLoadTools } from './tools/load.tools';
import { registerQuestionnaireTools } from './tools/questionnaire.tools';

async function listTools() {
  const server = new McpServer({ name: 'test', version: '1' });
  const ctx = {} as ToolContext;
  const deps = {} as ToolDeps;
  for (const register of [
    registerAthleteTools,
    registerAthleteWriteTools,
    registerCalendarReadTools,
    registerCalendarWriteTools,
    registerExerciseTools,
    registerLoadTools,
    registerQuestionnaireTools,
  ]) {
    register(server, ctx, deps);
  }
  const [serverSide, clientSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1' });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return (await client.listTools()).tools;
}

describe('MCP tool definitions', () => {
  it('give every tool a title, where clients look for it', async () => {
    const tools = await listTools();
    expect(tools.length).toBeGreaterThan(10);
    for (const tool of tools) {
      expect(tool.title).toBeTruthy();
      expect(tool.annotations?.title).toBe(tool.title);
    }
  });

  it('are self-contained: no $ref that a client could fail to resolve', async () => {
    const tools = await listTools();
    for (const tool of tools) {
      const schemas = JSON.stringify([tool.inputSchema, tool.outputSchema]);
      expect({ name: tool.name, hasRef: schemas.includes('"$ref"') }).toEqual({
        name: tool.name,
        hasRef: false,
      });
      expect(schemas).not.toContain('"anyOf":[]');
    }
  });

  // The description of a field wins over that of its schema
  it('tell the write tools how strength workouts go', async () => {
    const tools = await listTools();
    for (const name of ['plan_sessions', 'update_session']) {
      const tool = tools.find((candidate) => candidate.name === name);
      expect({ name, schema: JSON.stringify(tool?.inputSchema) }).toEqual({
        name,
        schema: expect.stringContaining('exercise and group items'),
      });
    }
  });

  it("point plan_sessions' workoutSteps at list_exercises", async () => {
    const tools = await listTools();
    const plan = tools.find((tool) => tool.name === 'plan_sessions');
    const sessions = (
      plan?.inputSchema.properties as {
        sessions: {
          items: { properties: { workoutSteps: { description?: string } } };
        };
      }
    ).sessions;
    expect(sessions.items.properties.workoutSteps.description).toContain(
      'list_exercises',
    );
  });
});
