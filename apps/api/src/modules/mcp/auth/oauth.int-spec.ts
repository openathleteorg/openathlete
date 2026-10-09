import { randomBytes } from 'node:crypto';

import { ConfigService } from '@nestjs/config';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_USER_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { McpAuthService } from './mcp-auth.service';
import { OAuthClientsService } from './oauth-clients.service';
import { AuthorizeError, OAuthError } from './oauth-error';
import { OAuthService } from './oauth.service';
import { pkceChallenge } from './tokens';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const REDIRECT = 'https://agent.example/oauth/callback';
const RESOURCE = 'https://api.example/mcp';

describe('MCP OAuth (PostgreSQL)', () => {
  let prisma: PrismaService;
  let clients: OAuthClientsService;
  let oauth: OAuthService;
  let auth: McpAuthService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const env: Record<string, string> = {
      APP_URL: 'https://app.example',
      API_PUBLIC_URL: 'https://api.example',
    };
    const config = { get: (key: string) => env[key] } as ConfigService;
    clients = new OAuthClientsService(prisma);
    oauth = new OAuthService(prisma, clients, config as never);
    auth = new McpAuthService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
  });

  const register = (body: Record<string, unknown> = {}) =>
    clients.register({
      client_name: 'Test agent',
      redirect_uris: [REDIRECT],
      token_endpoint_auth_method: 'none',
      ...body,
    });

  /** Consent, then the code exchange, as a client goes through them */
  async function connect(clientId: string, scope = 'read write') {
    const verifier = randomBytes(32).toString('base64url');
    const request = {
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: 'S256',
      scope,
      state: 'state-1',
      resource: RESOURCE,
    };
    const redirect = new URL(await oauth.decide(athlete, request, true));
    return {
      redirect,
      verifier,
      code: redirect.searchParams.get('code')!,
      exchange: (overrides: Record<string, string> = {}) =>
        oauth.token(
          {
            grant_type: 'authorization_code',
            code: redirect.searchParams.get('code'),
            redirect_uri: REDIRECT,
            code_verifier: verifier,
            resource: RESOURCE,
            ...overrides,
          },
          { clientId },
        ),
    };
  }

  it('advertises the endpoints, PKCE and the resource', () => {
    expect(oauth.metadata()).toMatchObject({
      issuer: 'https://api.example',
      authorization_endpoint: 'https://api.example/oauth/authorize',
      token_endpoint: 'https://api.example/oauth/token',
      registration_endpoint: 'https://api.example/oauth/register',
      code_challenge_methods_supported: ['S256'],
      authorization_response_iss_parameter_supported: true,
    });
    expect(oauth.resourceMetadata()).toMatchObject({
      resource: RESOURCE,
      authorization_servers: ['https://api.example'],
    });
  });

  it('registers clients and refuses unsafe redirect URIs', async () => {
    const client = await register();
    expect(client).toMatchObject({
      client_name: 'Test agent',
      token_endpoint_auth_method: 'none',
      redirect_uris: [REDIRECT],
    });
    expect(client).not.toHaveProperty('client_secret');

    const loopback = await register({
      redirect_uris: ['http://127.0.0.1:4567/cb', 'cursor://anysphere/oauth'],
    });
    expect(loopback.redirect_uris).toHaveLength(2);

    for (const uri of [
      'http://agent.example/cb',
      'javascript:alert(1)',
      'https://agent.example/cb#fragment',
    ]) {
      await expect(register({ redirect_uris: [uri] })).rejects.toMatchObject({
        code: 'invalid_redirect_uri',
      });
    }
  });

  it('only trusts the redirect URI of a known client', async () => {
    const client = await register();
    const base = {
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: REDIRECT,
      code_challenge: pkceChallenge('v'.repeat(43)),
      code_challenge_method: 'S256',
    };

    // Unknown client or redirect URI: shown, never redirected to
    for (const request of [
      { ...base, client_id: 'nobody' },
      { ...base, redirect_uri: 'https://evil.example/cb' },
    ]) {
      const error = await oauth.validate(request).catch((e) => e);
      expect(error).toBeInstanceOf(AuthorizeError);
      expect(error.redirectUri).toBeNull();
    }

    // A valid client gets its error back
    const noPkce = await oauth
      .validate({ ...base, code_challenge: undefined, state: 's' })
      .catch((e) => e);
    expect(noPkce).toMatchObject({
      code: 'invalid_request',
      redirectUri: REDIRECT,
      state: 's',
    });
    const plain = await oauth
      .validate({ ...base, code_challenge_method: 'plain' })
      .catch((e) => e);
    expect(plain.code).toBe('invalid_request');
    const otherResource = await oauth
      .validate({ ...base, resource: 'https://other.example/mcp' })
      .catch((e) => e);
    expect(otherResource.code).toBe('invalid_target');
    const scope = await oauth
      .validate({ ...base, scope: 'admin' })
      .catch((e) => e);
    expect(scope.code).toBe('invalid_scope');
  });

  it('issues tokens for a code once, bound to its verifier', async () => {
    const client = await register();
    const { redirect, exchange } = await connect(client.client_id);
    expect(redirect.origin + redirect.pathname).toBe(REDIRECT);
    expect(redirect.searchParams.get('state')).toBe('state-1');
    expect(redirect.searchParams.get('iss')).toBe('https://api.example');

    const tokens = await exchange();
    expect(tokens).toMatchObject({
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'read write',
    });
    expect(tokens.access_token).toMatch(/^oa_at_/);
    expect(tokens.refresh_token).toMatch(/^oa_rt_/);

    // The access token acts for the user, with the scopes approved
    const principal = await auth.authenticate(tokens.access_token);
    expect(principal).toMatchObject({
      user: { userId: DELETED_USER_ID },
      scopes: ['read', 'write'],
    });

    // A code is used once
    await expect(exchange()).rejects.toMatchObject({ code: 'invalid_grant' });
  });

  it('burns a code presented with a wrong verifier', async () => {
    const client = await register();
    const { exchange } = await connect(client.client_id);
    await expect(
      exchange({ code_verifier: 'w'.repeat(43) }),
    ).rejects.toMatchObject({ code: 'invalid_grant' });
    await expect(exchange()).rejects.toMatchObject({ code: 'invalid_grant' });
  });

  it('refuses a code exchanged by another client', async () => {
    const client = await register();
    const other = await register();
    const { code, verifier } = await connect(client.client_id);
    await expect(
      oauth.token(
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT,
          code_verifier: verifier,
        },
        { clientId: other.client_id },
      ),
    ).rejects.toMatchObject({ code: 'invalid_grant' });
  });

  it('checks the secret of confidential clients', async () => {
    const client = await register({
      token_endpoint_auth_method: 'client_secret_post',
    });
    expect(client.client_secret).toMatch(/^oa_cs_/);
    const { code, verifier } = await connect(client.client_id);
    const body = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT,
      code_verifier: verifier,
    };
    const error = await oauth
      .token(body, { clientId: client.client_id, clientSecret: 'wrong' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(OAuthError);
    expect(error).toMatchObject({ code: 'invalid_client', status: 401 });
  });

  it('rotates refresh tokens and revokes the grant when one is replayed', async () => {
    const client = await register();
    const { exchange } = await connect(client.client_id);
    const first = await exchange();
    const refresh = (token: string, scope?: string) =>
      oauth.token(
        { grant_type: 'refresh_token', refresh_token: token, scope },
        { clientId: client.client_id },
      );

    const second = await refresh(first.refresh_token);
    expect(second.refresh_token).not.toBe(first.refresh_token);
    expect(await auth.authenticate(second.access_token)).not.toBeNull();

    // A narrower scope is fine, a wider one is not
    const narrow = await refresh(second.refresh_token, 'read');
    expect(narrow.scope).toBe('read');

    // The first refresh token again: someone copied it
    await expect(refresh(first.refresh_token)).rejects.toMatchObject({
      code: 'invalid_grant',
    });
    expect(await auth.authenticate(narrow.access_token)).toBeNull();
    await expect(refresh(narrow.refresh_token)).rejects.toMatchObject({
      code: 'invalid_grant',
    });
  });

  it('approving the same client again updates its access', async () => {
    const client = await register();
    await (await connect(client.client_id, 'read')).exchange();
    await (await connect(client.client_id, 'read write')).exchange();

    const grants = await prisma.mcpGrant.findMany({
      where: {
        userId: DELETED_USER_ID,
        kind: 'OAUTH',
        clientId: client.client_id,
      },
    });
    expect(grants).toHaveLength(1);
    expect(grants[0].scopes).toEqual(['read', 'write']);
  });

  it('declining sends the user back with access_denied', async () => {
    const client = await register();
    const back = new URL(
      await oauth.decide(
        athlete,
        {
          response_type: 'code',
          client_id: client.client_id,
          redirect_uri: REDIRECT,
          code_challenge: pkceChallenge('v'.repeat(43)),
          code_challenge_method: 'S256',
          state: 'abc',
        },
        false,
      ),
    );
    expect(back.searchParams.get('error')).toBe('access_denied');
    expect(back.searchParams.get('state')).toBe('abc');
    expect(back.searchParams.has('code')).toBe(false);
  });

  it('a revoked access stops working at once', async () => {
    const client = await register();
    const tokens = await (await connect(client.client_id)).exchange();
    const [grant] = await auth
      .list(athlete)
      .then((all) =>
        all.filter(
          (connection) =>
            connection.kind === 'OAUTH' && connection.name === 'Test agent',
        ),
      );

    await auth.revoke(athlete, grant.mcpGrantId);

    expect(await auth.authenticate(tokens.access_token)).toBeNull();
    await expect(
      oauth.token(
        { grant_type: 'refresh_token', refresh_token: tokens.refresh_token },
        { clientId: client.client_id },
      ),
    ).rejects.toMatchObject({ code: 'invalid_grant' });
  });

  it("revocation by the client removes its access, never another client's", async () => {
    const client = await register();
    const other = await register();
    const tokens = await (await connect(client.client_id)).exchange();

    await oauth.revoke(tokens.refresh_token, { clientId: other.client_id });
    expect(await auth.authenticate(tokens.access_token)).not.toBeNull();

    await oauth.revoke(tokens.refresh_token, { clientId: client.client_id });
    expect(await auth.authenticate(tokens.access_token)).toBeNull();
  });

  it('personal tokens act for their owner until revoked or expired', async () => {
    const { token, connection } = await auth.createPersonalToken(athlete, {
      name: 'My script',
      scopes: ['read'],
      expiresInDays: 30,
    });
    expect(token).toMatch(/^oa_pat_/);
    expect(connection).toMatchObject({
      kind: 'PERSONAL_TOKEN',
      name: 'My script',
      scopes: ['read'],
      tokenHint: token.slice(-4),
    });
    // Only its hash is stored
    expect(await prisma.mcpGrant.count({ where: { tokenHash: token } })).toBe(
      0,
    );

    expect(await auth.authenticate(token)).toMatchObject({
      user: { userId: DELETED_USER_ID },
      scopes: ['read'],
    });
    expect(await auth.authenticate(`${token}x`)).toBeNull();
    expect(await auth.authenticate('oa_pat_unknown')).toBeNull();

    await prisma.mcpGrant.update({
      where: { mcpGrantId: connection.mcpGrantId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await auth.authenticate(token)).toBeNull();
  });

  it("a user cannot revoke someone else's access", async () => {
    const coach = { ...athlete, userId: COACH_USER_ID } as AuthUser;
    const { connection } = await auth.createPersonalToken(athlete, {
      name: 'Mine',
      scopes: ['read'],
      expiresInDays: null,
    });
    await expect(auth.revoke(coach, connection.mcpGrantId)).rejects.toThrow(
      'Connection not found',
    );
  });

  it('cleans up expired codes and tokens and abandoned clients', async () => {
    const client = await register();
    await prisma.oAuthClient.update({
      where: { clientId: client.client_id },
      data: { createdAt: new Date('2026-01-01') },
    });

    await oauth.deleteExpired();

    // The fixture's code and tokens expired at insertion; its client has
    // grants and stays
    expect(await prisma.oAuthAuthorizationCode.count()).toBe(0);
    expect(await prisma.mcpToken.count()).toBe(0);
    expect(
      await prisma.oAuthClient.findMany({ select: { clientId: true } }),
    ).toEqual([{ clientId: 'client-1' }]);
  });
});
