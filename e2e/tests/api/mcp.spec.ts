import { type APIRequestContext, expect, test } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL, WEB_URL } from '../../support/env';

// As self-hosted: agents reach the API through the web app's /api
const MCP_URL = `${WEB_URL}/api/mcp`;
const REDIRECT = 'http://127.0.0.1:33418/callback';

type JsonRpcResponse = {
  result?: Record<string, unknown> & {
    tools?: { name: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
    content?: { text: string }[];
  };
  error?: { message: string };
};

/** One JSON-RPC request, as an MCP client sends it over Streamable HTTP */
async function rpc(
  request: APIRequestContext,
  token: string,
  method: string,
  params: Record<string, unknown> = {},
) {
  const response = await request.post(MCP_URL, {
    headers: {
      ...apiHeaders(undefined, token),
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-06-18',
    },
    data: { jsonrpc: '2.0', id: 1, method, params },
  });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as JsonRpcResponse;
}

const callTool = async (
  request: APIRequestContext,
  token: string,
  name: string,
  args: Record<string, unknown> = {},
) => {
  const { result } = await rpc(request, token, 'tools/call', {
    name,
    arguments: args,
  });
  expect(result?.isError ?? false, result?.content?.[0]?.text).toBe(false);
  return result!.structuredContent!;
};

const day = (offset: number) =>
  new Date(Date.now() + offset * 24 * 3600 * 1000).toISOString().slice(0, 10);

test('an MCP client connects through OAuth, plans sessions, and loses access once revoked', async ({
  request,
}) => {
  const athlete = await createAthlete(request);

  // Discovery, from the 401 of the MCP endpoint
  const anonymous = await request.post(MCP_URL, {
    headers: apiHeaders(),
    data: { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
  });
  expect(anonymous.status()).toBe(401);
  const challenge = anonymous.headers()['www-authenticate'];
  const metadataUrl = /resource_metadata="([^"]+)"/.exec(challenge)?.[1];
  expect(metadataUrl).toBe(
    `${WEB_URL}/api/.well-known/oauth-protected-resource/mcp`,
  );
  const resource = await (await request.get(metadataUrl!)).json();
  expect(resource).toMatchObject({
    resource: MCP_URL,
    authorization_servers: [`${WEB_URL}/api`],
  });
  // RFC 8414 location for an issuer with a path, at the root of the domain
  const server = await (
    await request.get(`${WEB_URL}/.well-known/oauth-authorization-server/api`)
  ).json();
  expect(server).toMatchObject({
    issuer: `${WEB_URL}/api`,
    code_challenge_methods_supported: ['S256'],
  });

  // Registration, then the user approves on the consent page
  const registration = await request.post(server.registration_endpoint, {
    headers: apiHeaders(),
    data: { client_name: 'E2E agent', redirect_uris: [REDIRECT] },
  });
  expect(registration.status()).toBe(201);
  const client = await registration.json();

  const verifier = randomBytes(32).toString('base64url');
  const query = {
    response_type: 'code',
    client_id: client.client_id,
    redirect_uri: REDIRECT,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    scope: 'read write',
    state: 'e2e-state',
    resource: MCP_URL,
  };
  const authorize = await request.get(
    `${server.authorization_endpoint}?${new URLSearchParams(query)}`,
    { headers: apiHeaders(), maxRedirects: 0 },
  );
  expect(authorize.status()).toBe(302);
  expect(authorize.headers().location).toContain(`${WEB_URL}/oauth/authorize?`);

  const decision = await request.post(`${API_URL}/oauth/authorize`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: { ...query, approve: true },
  });
  expect(decision.status()).toBe(200);
  const back = new URL((await decision.json()).redirectTo);
  expect(back.searchParams.get('state')).toBe('e2e-state');
  expect(back.searchParams.get('iss')).toBe(`${WEB_URL}/api`);

  const tokenResponse = await request.post(server.token_endpoint, {
    headers: apiHeaders(),
    form: {
      grant_type: 'authorization_code',
      code: back.searchParams.get('code')!,
      redirect_uri: REDIRECT,
      client_id: client.client_id,
      code_verifier: verifier,
      resource: MCP_URL,
    },
  });
  expect(tokenResponse.status(), await tokenResponse.text()).toBe(200);
  const tokens = await tokenResponse.json();
  expect(tokens.scope).toBe('read write');

  // The MCP session itself
  const init = await rpc(request, tokens.access_token, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'e2e', version: '1.0.0' },
  });
  expect(init.result).toMatchObject({
    serverInfo: { name: 'openathlete' },
    capabilities: { tools: {}, prompts: {} },
  });
  const tools = await rpc(request, tokens.access_token, 'tools/list');
  expect(tools.result?.tools?.map((tool) => tool.name)).toEqual(
    expect.arrayContaining(['get_athlete_context', 'plan_sessions']),
  );

  const context = await callTool(
    request,
    tokens.access_token,
    'get_athlete_context',
  );
  expect(context).toMatchObject({ access: { canWrite: true } });
  const planned = await callTool(
    request,
    tokens.access_token,
    'plan_sessions',
    {
      sessions: [
        {
          date: day(5),
          time: '18:00',
          name: 'Agent intervals',
          sport: 'RUNNING',
          workoutSteps: [
            { kind: 'warmup', durationSeconds: 600 },
            {
              kind: 'repeat',
              times: 5,
              steps: [
                {
                  kind: 'work',
                  durationSeconds: 120,
                  targets: [{ type: 'pace', min: '4:00' }],
                },
                { kind: 'recovery', durationSeconds: 60 },
              ],
            },
          ],
        },
      ],
    },
  );
  expect(planned).toMatchObject({
    count: 1,
    items: [{ name: 'Agent intervals', plannedMinutes: 25 }],
  });

  // The session is in the athlete's calendar, as the app reads it
  const events = await (
    await request.get(`${API_URL}/event`, {
      headers: apiHeaders(undefined, athlete.accessToken),
    })
  ).json();
  expect(events.map((event: { name: string }) => event.name)).toContain(
    'Agent intervals',
  );

  // No sessions in stateless mode
  const get = await request.get(MCP_URL, {
    headers: apiHeaders(undefined, tokens.access_token),
  });
  expect(get.status()).toBe(405);

  // The user revokes the agent: its tokens stop working at once
  const connections = await (
    await request.get(`${API_URL}/mcp/connections`, {
      headers: apiHeaders(undefined, athlete.accessToken),
    })
  ).json();
  expect(connections).toMatchObject([{ kind: 'OAUTH', name: 'E2E agent' }]);
  const revoked = await request.delete(
    `${API_URL}/mcp/connections/${connections[0].mcpGrantId}`,
    { headers: apiHeaders(undefined, athlete.accessToken) },
  );
  expect(revoked.status()).toBe(204);
  const refused = await request.post(MCP_URL, {
    headers: apiHeaders(undefined, tokens.access_token),
    data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
  });
  expect(refused.status()).toBe(401);
  expect(refused.headers()['www-authenticate']).toContain('invalid_token');
});

test('a read-only personal token reads but is offered no write tool', async ({
  request,
}) => {
  const athlete = await createAthlete(request);
  const created = await request.post(`${API_URL}/mcp/tokens`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: { name: 'Script', scopes: ['read'], expiresInDays: 30 },
  });
  expect(created.status()).toBe(201);
  const { token } = await created.json();
  expect(token).toMatch(/^oa_pat_/);

  const tools = await rpc(request, token, 'tools/list');
  const names = tools.result?.tools?.map((tool) => tool.name) ?? [];
  expect(names).toContain('get_calendar');
  expect(names).not.toContain('plan_sessions');

  const calendar = await callTool(request, token, 'get_calendar', {
    from: day(-7),
    to: day(7),
  });
  expect(calendar).toMatchObject({ items: [] });
});

test('browser-based MCP clients may call the endpoint from any origin', async ({
  request,
}) => {
  const preflight = await request.fetch(`${API_URL}/mcp`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://inspector.example',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers':
        'authorization,content-type,mcp-protocol-version',
    },
  });
  expect(preflight.status()).toBe(204);
  expect(preflight.headers()['access-control-allow-origin']).toBe('*');

  // The app's own routes keep their origins
  const app = await request.fetch(`${API_URL}/mcp/connections`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://inspector.example',
      'Access-Control-Request-Method': 'GET',
    },
  });
  expect(app.headers()['access-control-allow-origin']).toBeUndefined();
});
