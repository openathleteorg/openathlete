// Runs the built AI agents through AiService against fake provider APIs,
// with the same CommonJS output and module loading as production (Jest
// cannot load Mastra's dynamically imported ESM providers).
//
//   pnpm build && pnpm test:agents
//
// It checks what unit tests cannot: which key each provider actually
// receives, how structured output is requested, and how real provider
// errors are reported.

const assert = require('node:assert/strict');
const { afterEach, before, test } = require('node:test');

// Instance keys exist, so a BYOK call using them would be a leak
process.env.OPENAI_API_KEY = 'sk-instance-openai';
process.env.ANTHROPIC_API_KEY = 'sk-instance-anthropic';
process.env.MASTRA_TELEMETRY_DISABLED = '1';
// Loading the application module validates the environment (no .env in CI)
process.env.ENV ??= 'development';
process.env.NODE_ENV ??= 'development';
process.env.HASH_PEPPER ??= 'test-pepper-at-least-32-characters-long';
process.env.JWT_SECRET_KEY ??= 'test-jwt-secret-at-least-32-characters-long';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';

const {
  activitySummaryAgent,
  activitySummaryOutputSchema,
  eventGenerationAgent,
  extractRpeAgent,
  rpeOutputSchema,
} = require('../dist/mastra/agents');
const { AiService } = require('../dist/modules/ai/services/ai.service');
const { trainingEventSchema } = require(
  require.resolve('@openathlete/shared', { paths: [__dirname] }),
);

const originalFetch = globalThis.fetch;
let requests = [];
let usageRecords = [];

const generatedEvent = {
  type: 'TRAINING',
  name: 'Easy run',
  description: '1h easy',
  sport: 'RUNNING',
  startDate: '2026-10-05T08:00:00.000Z',
  endDate: '2026-10-05T09:00:00.000Z',
  workout: {
    steps: [
      {
        stepType: 'STEADY',
        name: 'Easy',
        durationType: 'TIME',
        durationValue: 3600,
      },
    ],
  },
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Fake OpenAI, Anthropic and OpenAI-compatible APIs answering with `text`. */
function providersAnswer(text, status = 200) {
  globalThis.fetch = async (url, init) => {
    const headers = new Headers(init.headers);
    const body = JSON.parse(init.body);
    requests.push({ url: String(url), headers, body });
    if (status !== 200) {
      return json({ error: { message: 'Provider error' } }, status);
    }
    if (String(url).endsWith('/responses')) {
      return json({
        id: 'resp_1',
        object: 'response',
        created_at: 1759500000,
        status: 'completed',
        model: body.model,
        output: [
          {
            type: 'message',
            id: 'msg_1',
            status: 'completed',
            role: 'assistant',
            content: [{ type: 'output_text', text, annotations: [] }],
          },
        ],
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
      });
    }
    if (String(url).endsWith('/messages')) {
      return json({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [{ type: 'text', text }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
      });
    }
    if (String(url).endsWith('/chat/completions')) {
      return json({
        id: 'chatcmpl-1',
        object: 'chat.completion',
        created: 1759500000,
        model: body.model,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: text },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });
    }
    throw new Error(`Unexpected provider URL ${url}`);
  };
}

function model(config, source = 'own_key') {
  return {
    task: 'EVENT_GENERATION',
    source,
    userId: 1,
    provider: 'test',
    modelId: 'test',
    credentialId: null,
    config,
  };
}

const ai = new AiService(
  { aiCredential: { update: async () => undefined } },
  { record: async (owner, usage) => usageRecords.push({ owner, usage }) },
);

before(() => {
  // Mastra warns about the recursive repeat block schema
  console.warn = () => undefined;
  console.error = () => undefined;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  requests = [];
  usageRecords = [];
});

test("OpenAI runs on the user's key, without strict mode", async () => {
  providersAnswer(JSON.stringify(generatedEvent));

  const event = await ai.generateObject(
    eventGenerationAgent,
    model({ id: 'openai/gpt-5.1', apiKey: 'sk-user-openai' }),
    '1h easy run',
    trainingEventSchema,
  );

  const [request] = requests;
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.headers.get('authorization'), 'Bearer sk-user-openai');
  // OpenAI rejects the recursive training event schema in strict mode
  assert.equal(request.body.text.format.type, 'json_schema');
  assert.equal(request.body.text.format.strict, false);
  assert.deepEqual(event.startDate, new Date('2026-10-05T08:00:00.000Z'));
  assert.deepEqual(event.workout.steps[0].targets, []);
});

test("Anthropic runs on the user's key", async () => {
  providersAnswer(JSON.stringify(generatedEvent));

  const event = await ai.generateObject(
    eventGenerationAgent,
    model({ id: 'anthropic/claude-sonnet-4-5', apiKey: 'sk-ant-user' }),
    '1h easy run',
    trainingEventSchema,
  );

  const [request] = requests;
  assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(request.headers.get('x-api-key'), 'sk-ant-user');
  assert.equal(request.body.model, 'claude-sonnet-4-5');
  assert.equal(event.workout.steps[0].durationValue, 3600);
});

test('hosted Claude 5.x gets the workout schema in the prompt, at the effort of the feature', async () => {
  providersAnswer(JSON.stringify(generatedEvent));

  const event = await ai.generateObject(
    eventGenerationAgent,
    {
      ...model({ id: 'anthropic/claude-sonnet-5-5' }, 'hosted'),
      provider: 'anthropic',
      modelId: 'claude-sonnet-5-5',
    },
    '1h easy run',
    trainingEventSchema,
  );

  const [request] = requests;
  assert.equal(request.headers.get('x-api-key'), 'sk-instance-anthropic');
  assert.equal(request.body.output_config.effort, 'medium');
  // Claude's native JSON output refuses recursive schemas (repeat blocks)
  assert.equal(request.body.output_config.format, undefined);
  assert.match(JSON.stringify(request.body), /durationValue/);
  // Forced tool use is refused by Claude 5.5 models
  assert.equal(request.body.tool_choice, undefined);
  assert.equal(request.body.tools, undefined);
  assert.equal(event.workout.steps[0].durationValue, 3600);
  assert.equal(request.body.temperature, undefined);
});

test('summarises an activity on hosted Claude, at a medium effort', async () => {
  const summary = {
    headline: 'Tempo held, 54 s lost to the heat',
    points: ['7% of drift after the warm-up, in 27 °C'],
    suggestion: null,
  };
  providersAnswer(JSON.stringify(summary));

  const result = await ai.generateObject(
    activitySummaryAgent,
    {
      ...model({ id: 'anthropic/claude-haiku-5-5' }, 'hosted'),
      task: 'ACTIVITY_SUMMARY',
      provider: 'anthropic',
      modelId: 'claude-haiku-5-5',
    },
    '=== ACTIVITY ===\nName: Tempo',
    activitySummaryOutputSchema,
  );

  const [request] = requests;
  assert.equal(request.headers.get('x-api-key'), 'sk-instance-anthropic');
  assert.equal(request.body.output_config.effort, 'medium');
  assert.match(JSON.stringify(request.body), /explain/i);
  assert.deepEqual(result, summary);
});

test('a summary with too many points is refused, not stored', async () => {
  providersAnswer(
    JSON.stringify({
      headline: 'Good run',
      points: ['a', 'b', 'c', 'd'],
      suggestion: null,
    }),
  );

  await assert.rejects(
    ai.generateObject(
      activitySummaryAgent,
      model({ id: 'openai/gpt-5.1', apiKey: 'sk-user-openai' }),
      'Run',
      activitySummaryOutputSchema,
    ),
  );
});

test('older Claude models get no effort, which they reject', async () => {
  providersAnswer('Nice session!');

  await ai.generateText(
    extractRpeAgent,
    {
      ...model({ id: 'anthropic/claude-haiku-4-5', apiKey: 'sk-ant-user' }),
      provider: 'anthropic',
      modelId: 'claude-haiku-4-5',
    },
    'Hi',
  );

  const [request] = requests;
  assert.equal(request.body.output_config?.effort, undefined);
});

test('counts the tokens each provider reports', async () => {
  providersAnswer('Nice session!');

  for (const config of [
    { id: 'openai/gpt-5.1', apiKey: 'sk-user-openai' },
    { id: 'anthropic/claude-sonnet-4-5', apiKey: 'sk-ant-user' },
  ]) {
    await ai.generateText(extractRpeAgent, model(config, 'hosted'), 'Hi');
  }

  assert.equal(usageRecords.length, 2);
  for (const { owner, usage } of usageRecords) {
    assert.equal(owner.source, 'hosted');
    assert.equal(owner.userId, 1);
    assert.equal(usage.inputTokens, 10);
    assert.equal(usage.outputTokens, 10);
  }
});

test('custom OpenAI-compatible endpoints get the schema in the prompt', async () => {
  providersAnswer('{"extractedRpe": 0.7}');

  const result = await ai.generateObject(
    extractRpeAgent,
    model({
      providerId: 'custom',
      modelId: 'llama3.1',
      url: 'http://ollama.test:11434/v1',
      apiKey: 'not-needed',
    }),
    'Felt hard',
    rpeOutputSchema,
  );

  const [request] = requests;
  assert.equal(request.url, 'http://ollama.test:11434/v1/chat/completions');
  assert.equal(request.body.model, 'llama3.1');
  assert.equal(request.body.response_format, undefined);
  assert.match(JSON.stringify(request.body.messages), /extractedRpe/);
  assert.deepEqual(result, { extractedRpe: 0.7 });
});

test('OpenCode Go sends the session header to its endpoint', async () => {
  providersAnswer('OK');

  await ai.generateText(
    extractRpeAgent,
    model({
      id: 'opencode-go/kimi-k3',
      apiKey: 'sk-opencode',
      headers: { 'x-opencode-session': 'session-1' },
    }),
    'Hi',
  );

  const [request] = requests;
  assert.equal(
    request.url,
    'https://opencode.ai/inference/go/openai/v1/chat/completions',
  );
  assert.equal(request.headers.get('authorization'), 'Bearer sk-opencode');
  assert.equal(request.headers.get('x-opencode-session'), 'session-1');
});

test('OpenAI-compatible endpoints send the credential custom headers', async () => {
  providersAnswer('OK');

  await ai.generateText(
    extractRpeAgent,
    model({
      providerId: 'custom',
      modelId: 'llama3.1',
      url: 'https://gateway.test/v1',
      apiKey: 'sk-gateway',
      headers: {
        'x-opencode-session': 'session-1',
        'x-custom-header': 'value',
      },
    }),
    'Hi',
  );

  const [request] = requests;
  assert.equal(request.headers.get('x-opencode-session'), 'session-1');
  assert.equal(request.headers.get('x-custom-header'), 'value');
});

test('plain text generation returns the answer', async () => {
  providersAnswer('Nice session!');

  const text = await ai.generateText(
    extractRpeAgent,
    model({ id: 'openai/gpt-5.1', apiKey: 'sk-user-openai' }),
    'Hi',
  );

  assert.equal(text, 'Nice session!');
});

for (const [status, code] of [
  [401, 'AI_CREDENTIAL_REJECTED'],
  [429, 'AI_QUOTA_EXCEEDED'],
  [500, 'AI_PROVIDER_ERROR'],
]) {
  test(`a provider ${status} is reported as ${code}`, async () => {
    providersAnswer('', status);

    await assert.rejects(
      ai.generateText(
        extractRpeAgent,
        model({ id: 'anthropic/claude-sonnet-4-5', apiKey: 'sk-ant-user' }),
        'Hi',
      ),
      (error) => error.code === code && error.getStatus() === 422,
    );
  });
}

test('the application module graph loads', () => {
  // Circular imports between modules only fail at load time, as an
  // undefined decorator; Jest loads files one by one and misses them
  assert.doesNotThrow(() => require('../dist/modules/app.module'));
});
