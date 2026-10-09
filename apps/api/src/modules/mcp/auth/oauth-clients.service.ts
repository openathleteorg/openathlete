import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import { OAuthClient } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { OAuthError } from './oauth-error';
import { fetchPublicJson } from './public-fetch';
import { TOKEN_PREFIX, generateToken, hashToken } from './tokens';

/** How long the metadata document of a URL client is trusted */
const METADATA_TTL_MS = 24 * 3600 * 1000;
const MAX_REDIRECT_URIS = 10;

const SECRET_METHODS = ['client_secret_post', 'client_secret_basic'];
const AUTH_METHODS = ['none', ...SECRET_METHODS];

export type ClientRegistration = {
  client_id: string;
  client_id_issued_at: number;
  client_secret?: string;
  client_secret_expires_at?: number;
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  client_uri?: string;
  logo_uri?: string;
};

/**
 * Where a client may send users back with a code: an https URL, a loopback
 * http URL for local apps (any port, RFC 8252) or a private scheme of a
 * desktop app (cursor://, vscode://...). Never a URL that runs code.
 */
export function isAllowedRedirectUri(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === 'https:') return true;
  if (url.protocol === 'http:') {
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  }
  const scheme = url.protocol.slice(0, -1);
  return (
    /^[a-z][a-z0-9+.-]*$/.test(scheme) &&
    ![
      'javascript',
      'data',
      'file',
      'vbscript',
      'blob',
      'about',
      'ws',
      'wss',
    ].includes(scheme)
  );
}

/** A URL a client gives about itself, kept only when it is a web page */
function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

function clientName(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, 100)
    : fallback;
}

function redirectUris(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > MAX_REDIRECT_URIS ||
    !value.every(
      (uri) =>
        typeof uri === 'string' &&
        uri.length <= 2048 &&
        isAllowedRedirectUri(uri),
    )
  ) {
    throw new OAuthError(
      'invalid_redirect_uri',
      'redirect_uris must list 1 to 10 https, loopback or app URLs',
    );
  }
  return value as string[];
}

/** A client_id that is an https URL with a path: a metadata document */
export function isMetadataDocumentUrl(clientId: string): boolean {
  try {
    const url = new URL(clientId);
    return url.protocol === 'https:' && url.pathname !== '/' && !url.hash;
  } catch {
    return false;
  }
}

/**
 * OAuth clients. MCP clients mostly register themselves (RFC 7591), or use
 * the https URL of a metadata document as their id (Client ID Metadata
 * Documents), which spares a registration per server.
 */
@Injectable()
export class OAuthClientsService {
  private readonly logger = new Logger(OAuthClientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async register(body: Record<string, unknown>): Promise<ClientRegistration> {
    const uris = redirectUris(body.redirect_uris);
    const method =
      typeof body.token_endpoint_auth_method === 'string'
        ? body.token_endpoint_auth_method
        : 'none';
    if (!AUTH_METHODS.includes(method)) {
      throw new OAuthError(
        'invalid_client_metadata',
        `token_endpoint_auth_method must be one of ${AUTH_METHODS.join(', ')}`,
      );
    }
    const grantTypes = Array.isArray(body.grant_types)
      ? (body.grant_types as unknown[])
      : ['authorization_code', 'refresh_token'];
    if (
      !grantTypes.includes('authorization_code') ||
      grantTypes.some(
        (grant) => grant !== 'authorization_code' && grant !== 'refresh_token',
      )
    ) {
      throw new OAuthError(
        'invalid_client_metadata',
        'grant_types may only be authorization_code and refresh_token',
      );
    }
    if (
      Array.isArray(body.response_types) &&
      (body.response_types as unknown[]).some((type) => type !== 'code')
    ) {
      throw new OAuthError(
        'invalid_client_metadata',
        'response_types may only be code',
      );
    }

    const secret = SECRET_METHODS.includes(method)
      ? generateToken(TOKEN_PREFIX.clientSecret)
      : undefined;
    const client = await this.prisma.oAuthClient.create({
      data: {
        clientId: randomUUID(),
        name: clientName(body.client_name, 'MCP client'),
        redirectUris: uris,
        secretHash: secret ? hashToken(secret) : null,
        clientUri: httpsUrl(body.client_uri),
        logoUri: httpsUrl(body.logo_uri),
      },
    });

    return {
      client_id: client.clientId,
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      ...(secret && { client_secret: secret, client_secret_expires_at: 0 }),
      client_name: client.name,
      redirect_uris: client.redirectUris,
      grant_types: grantTypes as string[],
      response_types: ['code'],
      token_endpoint_auth_method: method,
      ...(client.clientUri && { client_uri: client.clientUri }),
      ...(client.logoUri && { logo_uri: client.logoUri }),
    };
  }

  /** The client of an id, fetching or refreshing a metadata document */
  async find(clientId: string): Promise<OAuthClient | null> {
    const stored = await this.prisma.oAuthClient.findUnique({
      where: { clientId },
    });
    if (!isMetadataDocumentUrl(clientId)) return stored;
    if (
      stored?.metadataFetchedAt &&
      Date.now() - stored.metadataFetchedAt.getTime() < METADATA_TTL_MS
    ) {
      return stored;
    }

    let document: Record<string, unknown>;
    try {
      const fetched = await fetchPublicJson(new URL(clientId));
      if (!fetched || typeof fetched !== 'object' || Array.isArray(fetched)) {
        throw new Error('Not a JSON object');
      }
      document = fetched as Record<string, unknown>;
    } catch (error) {
      this.logger.warn(
        `Client metadata document ${clientId} unavailable: ${(error as Error).message}`,
      );
      // A known client keeps working while its document is briefly down
      return stored;
    }
    if (document.client_id !== clientId) {
      this.logger.warn(`Client metadata document ${clientId} names another id`);
      return null;
    }
    // Only public clients: a document cannot hold a secret
    if (
      document.token_endpoint_auth_method &&
      document.token_endpoint_auth_method !== 'none'
    ) {
      this.logger.warn(
        `Client ${clientId} asks for an unsupported auth method`,
      );
      return null;
    }

    let uris: string[];
    try {
      uris = redirectUris(document.redirect_uris);
    } catch {
      return null;
    }
    const data = {
      name: clientName(document.client_name, new URL(clientId).host),
      redirectUris: uris,
      clientUri: httpsUrl(document.client_uri),
      logoUri: httpsUrl(document.logo_uri),
      metadataFetchedAt: new Date(),
    };
    return this.prisma.oAuthClient.upsert({
      where: { clientId },
      create: { clientId, ...data },
      update: data,
    });
  }
}
