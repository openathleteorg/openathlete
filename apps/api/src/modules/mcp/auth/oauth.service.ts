import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { OAuthClient } from '@openathlete/database';
import {
  ApiEnvSchemaType,
  McpScope,
  OAuthAuthorizeDetails,
  OAuthAuthorizeRequest,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { McpUrls, mcpUrls } from '../mcp-urls';
import { OAuthClientsService } from './oauth-clients.service';
import { AuthorizeError, OAuthError } from './oauth-error';
import { parseScopes } from './scopes';
import {
  TOKEN_PREFIX,
  generateToken,
  hashToken,
  pkceChallenge,
  sameHash,
} from './tokens';

const CODE_TTL_MS = 5 * 60 * 1000;
export const ACCESS_TOKEN_TTL_S = 3600;
const REFRESH_TOKEN_TTL_MS = 90 * 24 * 3600 * 1000;
const UNUSED_CLIENT_TTL_MS = 30 * 24 * 3600 * 1000;

/** A request that passed every check, ready for the user's decision */
type ValidRequest = {
  client: OAuthClient;
  redirectUri: string;
  scopes: McpScope[];
  resource: string;
  codeChallenge: string;
  state?: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
};

/** How the client authenticated at the token endpoint */
export type ClientCredentials = {
  clientId?: string;
  clientSecret?: string;
};

const sameResource = (a: string, b: string) =>
  a.replace(/\/+$/, '') === b.replace(/\/+$/, '');

/**
 * The OAuth 2.1 authorization server of the MCP endpoint: authorization code
 * with PKCE (S256 only), single-use refresh tokens, tokens bound to the MCP
 * resource (RFC 8707). The user approves on a page of the web app, where they
 * are already signed in.
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly urls: McpUrls;

  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: OAuthClientsService,
    config: ConfigService<ApiEnvSchemaType, true>,
  ) {
    this.urls = mcpUrls(config);
  }

  /** Authorization Server Metadata (RFC 8414) */
  metadata() {
    const { issuer } = this.urls;
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      revocation_endpoint: `${issuer}/oauth/revoke`,
      scopes_supported: ['read', 'write'],
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: [
        'none',
        'client_secret_post',
        'client_secret_basic',
      ],
      revocation_endpoint_auth_methods_supported: [
        'none',
        'client_secret_post',
        'client_secret_basic',
      ],
      code_challenge_methods_supported: ['S256'],
      client_id_metadata_document_supported: true,
      authorization_response_iss_parameter_supported: true,
      service_documentation:
        'https://docs.openathlete.org/docs/guides/ai-agents',
    };
  }

  /** Protected Resource Metadata of the MCP endpoint (RFC 9728) */
  resourceMetadata() {
    return {
      resource: this.urls.resource,
      authorization_servers: [this.urls.issuer],
      scopes_supported: ['read', 'write'],
      bearer_methods_supported: ['header'],
      resource_name: 'OpenAthlete',
      resource_documentation:
        'https://docs.openathlete.org/docs/guides/ai-agents',
    };
  }

  get consentPage() {
    return this.urls.consentPage;
  }

  /**
   * Checks an authorization request. Throws an AuthorizeError, with the
   * redirect URI only once the client and that URI are known to be valid.
   */
  async validate(request: OAuthAuthorizeRequest): Promise<ValidRequest> {
    const client = await this.clients.find(request.client_id);
    if (!client) {
      throw new AuthorizeError(
        'invalid_client',
        'Unknown client: register it first',
        null,
      );
    }
    if (!client.redirectUris.includes(request.redirect_uri)) {
      throw new AuthorizeError(
        'invalid_request',
        'redirect_uri is not registered for this client',
        null,
      );
    }

    const fail = (code: string, description: string) =>
      new AuthorizeError(
        code,
        description,
        request.redirect_uri,
        request.state,
      );
    if (request.response_type !== 'code') {
      throw fail('unsupported_response_type', 'response_type must be code');
    }
    if (
      !request.code_challenge ||
      request.code_challenge_method !== 'S256' ||
      !/^[A-Za-z0-9_-]{43}$/.test(request.code_challenge)
    ) {
      throw fail(
        'invalid_request',
        'PKCE is required: send code_challenge with code_challenge_method=S256',
      );
    }
    const scopes = parseScopes(request.scope);
    if (!scopes) {
      throw fail('invalid_scope', 'Scopes are read and write');
    }
    // Clients must name the resource; older ones only know the server
    const resource = request.resource ?? this.urls.resource;
    if (!sameResource(resource, this.urls.resource)) {
      throw fail(
        'invalid_target',
        `The only resource is ${this.urls.resource}`,
      );
    }

    return {
      client,
      redirectUri: request.redirect_uri,
      scopes,
      resource: this.urls.resource,
      codeChallenge: request.code_challenge,
      state: request.state,
    };
  }

  /** What the consent page shows */
  async details(
    user: AuthUser,
    request: OAuthAuthorizeRequest,
  ): Promise<OAuthAuthorizeDetails> {
    const valid = await this.validate(request);
    const existing = await this.prisma.mcpGrant.findUnique({
      where: {
        userId_clientId: {
          userId: user.userId,
          clientId: valid.client.clientId,
        },
      },
      select: { mcpGrantId: true },
    });
    return {
      clientName: valid.client.name,
      clientUri: valid.client.clientUri,
      logoUri: valid.client.logoUri,
      redirectHost: new URL(valid.redirectUri).host || valid.redirectUri,
      scopes: valid.scopes,
      alreadyConnected: Boolean(existing),
    };
  }

  /** The user's answer: back to the client with a code or access_denied */
  async decide(
    user: AuthUser,
    request: OAuthAuthorizeRequest,
    approve: boolean,
  ): Promise<string> {
    const valid = await this.validate(request);
    if (!approve) {
      return this.redirect(valid.redirectUri, {
        error: 'access_denied',
        error_description: 'The user declined',
        state: valid.state,
      });
    }

    const code = generateToken(TOKEN_PREFIX.code);
    await this.prisma.$transaction([
      this.prisma.mcpGrant.upsert({
        where: {
          userId_clientId: {
            userId: user.userId,
            clientId: valid.client.clientId,
          },
        },
        create: {
          kind: 'OAUTH',
          name: valid.client.name,
          scopes: valid.scopes,
          userId: user.userId,
          clientId: valid.client.clientId,
        },
        update: { name: valid.client.name, scopes: valid.scopes },
      }),
      this.prisma.oAuthAuthorizationCode.create({
        data: {
          codeHash: hashToken(code),
          clientId: valid.client.clientId,
          userId: user.userId,
          redirectUri: valid.redirectUri,
          codeChallenge: valid.codeChallenge,
          scopes: valid.scopes,
          resource: valid.resource,
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      }),
    ]);
    return this.redirect(valid.redirectUri, { code, state: valid.state });
  }

  /** The redirect URI with the response parameters, and the issuer (RFC 9207) */
  redirect(redirectUri: string, params: Record<string, string | undefined>) {
    const url = new URL(redirectUri);
    for (const [key, value] of Object.entries({
      ...params,
      iss: this.urls.issuer,
    })) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
    return url.toString();
  }

  /** Token endpoint, for both grants */
  async token(
    body: Record<string, unknown>,
    credentials: ClientCredentials,
  ): Promise<TokenResponse> {
    const field = (name: string) =>
      typeof body[name] === 'string' ? (body[name] as string) : undefined;
    switch (field('grant_type')) {
      case 'authorization_code':
        return this.exchangeCode(
          {
            code: field('code'),
            redirectUri: field('redirect_uri'),
            codeVerifier: field('code_verifier'),
            resource: field('resource'),
          },
          credentials,
        );
      case 'refresh_token':
        return this.refresh(
          { refreshToken: field('refresh_token'), scope: field('scope') },
          credentials,
        );
      default:
        throw new OAuthError(
          'unsupported_grant_type',
          'grant_type must be authorization_code or refresh_token',
        );
    }
  }

  /** The client calling the token endpoint, with its secret if it has one */
  private async authenticateClient({
    clientId,
    clientSecret,
  }: ClientCredentials): Promise<OAuthClient> {
    if (!clientId) {
      throw new OAuthError('invalid_client', 'client_id is required');
    }
    const client = await this.clients.find(clientId);
    if (!client) {
      throw new OAuthError('invalid_client', 'Unknown client');
    }
    if (
      client.secretHash &&
      (!clientSecret || !sameHash(clientSecret, client.secretHash))
    ) {
      throw new OAuthError('invalid_client', 'Client authentication failed');
    }
    return client;
  }

  private async exchangeCode(
    params: {
      code?: string;
      redirectUri?: string;
      codeVerifier?: string;
      resource?: string;
    },
    credentials: ClientCredentials,
  ): Promise<TokenResponse> {
    const client = await this.authenticateClient(credentials);
    if (!params.code || !params.codeVerifier || !params.redirectUri) {
      throw new OAuthError(
        'invalid_request',
        'code, code_verifier and redirect_uri are required',
      );
    }

    const codeHash = hashToken(params.code);
    const code = await this.prisma.oAuthAuthorizationCode.findUnique({
      where: { codeHash },
    });
    // Delete before checking: a code is used once, whatever the outcome
    const { count } = await this.prisma.oAuthAuthorizationCode.deleteMany({
      where: { codeHash },
    });
    const invalid = new OAuthError(
      'invalid_grant',
      'The code is invalid, expired or already used',
    );
    if (!code || !count || code.expiresAt < new Date()) throw invalid;
    if (
      code.clientId !== client.clientId ||
      code.redirectUri !== params.redirectUri ||
      pkceChallenge(params.codeVerifier) !== code.codeChallenge
    ) {
      throw invalid;
    }
    if (params.resource && !sameResource(params.resource, code.resource)) {
      throw new OAuthError('invalid_target', 'The resource does not match');
    }

    const grant = await this.prisma.mcpGrant.findUnique({
      where: {
        userId_clientId: { userId: code.userId, clientId: client.clientId },
      },
    });
    // The user revoked the access between consent and exchange
    if (!grant) throw invalid;
    return this.issueTokens(grant.mcpGrantId, code.scopes);
  }

  private async refresh(
    params: { refreshToken?: string; scope?: string },
    credentials: ClientCredentials,
  ): Promise<TokenResponse> {
    const client = await this.authenticateClient(credentials);
    if (!params.refreshToken) {
      throw new OAuthError('invalid_request', 'refresh_token is required');
    }
    const invalid = new OAuthError(
      'invalid_grant',
      'The refresh token is invalid or expired',
    );
    const stored = await this.prisma.mcpToken.findUnique({
      where: { tokenHash: hashToken(params.refreshToken) },
      include: { grant: true },
    });
    if (
      !stored ||
      stored.type !== 'REFRESH' ||
      stored.grant.clientId !== client.clientId
    ) {
      throw invalid;
    }
    if (stored.expiresAt < new Date()) throw invalid;

    // Exactly one exchange wins; a used token presented again was copied
    const { count } = await this.prisma.mcpToken.updateMany({
      where: { mcpTokenId: stored.mcpTokenId, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (!count) {
      this.logger.warn(
        `Refresh token of grant ${stored.grantId} replayed: revoking the grant's tokens`,
      );
      await this.prisma.mcpToken.deleteMany({
        where: { grantId: stored.grantId },
      });
      throw invalid;
    }

    // A refresh may narrow the scopes, never widen them
    let scopes = stored.grant.scopes as McpScope[];
    if (params.scope) {
      const asked = parseScopes(params.scope);
      if (!asked || asked.some((scope) => !scopes.includes(scope))) {
        throw new OAuthError('invalid_scope', 'Scopes exceed the grant');
      }
      scopes = asked;
    }
    return this.issueTokens(stored.grantId, scopes);
  }

  private async issueTokens(
    grantId: number,
    scopes: string[],
  ): Promise<TokenResponse> {
    const access = generateToken(TOKEN_PREFIX.access);
    const refresh = generateToken(TOKEN_PREFIX.refresh);
    const now = Date.now();
    await this.prisma.mcpToken.createMany({
      data: [
        {
          tokenHash: hashToken(access),
          type: 'ACCESS',
          grantId,
          expiresAt: new Date(now + ACCESS_TOKEN_TTL_S * 1000),
        },
        {
          tokenHash: hashToken(refresh),
          type: 'REFRESH',
          grantId,
          expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
        },
      ],
    });
    return {
      access_token: access,
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_TTL_S,
      refresh_token: refresh,
      scope: scopes.join(' '),
    };
  }

  /**
   * Token revocation (RFC 7009): the client disconnects, so its whole grant
   * goes. Unknown tokens succeed too, as the RFC asks.
   */
  async revoke(token: string | undefined, credentials: ClientCredentials) {
    const client = await this.authenticateClient(credentials);
    if (!token) {
      throw new OAuthError('invalid_request', 'token is required');
    }
    const stored = await this.prisma.mcpToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { grant: { select: { clientId: true } } },
    });
    if (stored && stored.grant.clientId === client.clientId) {
      await this.prisma.mcpGrant.deleteMany({
        where: { mcpGrantId: stored.grantId },
      });
    }
  }

  /**
   * Once a day: expired codes and tokens are useless, and clients nobody
   * approved within a month were abandoned (registration is open to all).
   */
  @Cron('25 3 * * *', { timeZone: 'UTC' })
  async deleteExpired() {
    const now = new Date();
    const [codes, tokens, clients] = await this.prisma.$transaction([
      this.prisma.oAuthAuthorizationCode.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      this.prisma.mcpToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.oAuthClient.deleteMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - UNUSED_CLIENT_TTL_MS) },
          grants: { none: {} },
          codes: { none: {} },
        },
      }),
    ]);
    if (codes.count || tokens.count || clients.count) {
      this.logger.log(
        `Deleted ${codes.count} expired codes, ${tokens.count} expired tokens and ${clients.count} unused clients`,
      );
    }
  }
}
