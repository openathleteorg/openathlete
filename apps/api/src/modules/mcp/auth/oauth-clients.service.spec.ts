import { OAuthClient } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  OAuthClientsService,
  isAllowedRedirectUri,
  isMetadataDocumentUrl,
} from './oauth-clients.service';
import { fetchPublicJson } from './public-fetch';
import { parseScopes } from './scopes';

jest.mock('./public-fetch', () => ({ fetchPublicJson: jest.fn() }));
const fetchDocument = fetchPublicJson as jest.MockedFunction<
  typeof fetchPublicJson
>;

const DOCUMENT_URL = 'https://agent.example/oauth/client.json';

/** Prisma with one table of clients, in memory */
function fakePrisma(initial: OAuthClient[] = []) {
  const rows = new Map(initial.map((row) => [row.clientId, row]));
  return {
    rows,
    oAuthClient: {
      findUnique: jest.fn(
        async ({ where }: { where: { clientId: string } }) =>
          rows.get(where.clientId) ?? null,
      ),
      upsert: jest.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { clientId: string };
          create: OAuthClient;
          update: Partial<OAuthClient>;
        }) => {
          const row = rows.has(where.clientId)
            ? { ...rows.get(where.clientId)!, ...update }
            : create;
          rows.set(where.clientId, row as OAuthClient);
          return row;
        },
      ),
    },
  };
}

describe('OAuth clients', () => {
  beforeEach(() => fetchDocument.mockReset());

  it('accepts https, loopback and app redirect URIs only', () => {
    for (const uri of [
      'https://claude.ai/api/mcp/auth_callback',
      'http://localhost:6274/oauth/callback',
      'http://127.0.0.1:33418/callback',
      'http://[::1]:8080/cb',
      'cursor://anysphere.cursor-mcp/oauth/callback',
      'vscode://vscode.github-authentication/did-authenticate',
    ]) {
      expect(isAllowedRedirectUri(uri)).toBe(true);
    }
    for (const uri of [
      'http://agent.example/cb',
      'https://agent.example/cb#token',
      'javascript:alert(1)',
      'data:text/html,hi',
      'file:///etc/passwd',
      'not a url',
    ]) {
      expect(isAllowedRedirectUri(uri)).toBe(false);
    }
  });

  it('recognizes metadata document ids', () => {
    expect(isMetadataDocumentUrl(DOCUMENT_URL)).toBe(true);
    expect(isMetadataDocumentUrl('https://agent.example/')).toBe(false);
    expect(isMetadataDocumentUrl('http://agent.example/client.json')).toBe(
      false,
    );
    expect(isMetadataDocumentUrl('0d7c4b3e-9d1f-4a35-9a43-1a2b3c4d5e6f')).toBe(
      false,
    );
  });

  it('reads the scopes asked for, all of them by default', () => {
    expect(parseScopes(undefined)).toEqual(['read', 'write']);
    expect(parseScopes('read')).toEqual(['read']);
    expect(parseScopes('read offline_access')).toEqual(['read']);
    expect(parseScopes('admin')).toBeNull();
  });

  it('fetches a metadata document once, then serves it from the database', async () => {
    const prisma = fakePrisma();
    const service = new OAuthClientsService(prisma as unknown as PrismaService);
    fetchDocument.mockResolvedValue({
      client_id: DOCUMENT_URL,
      client_name: 'Agent',
      client_uri: 'https://agent.example',
      logo_uri: 'javascript:alert(1)',
      redirect_uris: ['https://agent.example/callback'],
    });

    const client = await service.find(DOCUMENT_URL);
    expect(client).toMatchObject({
      name: 'Agent',
      clientUri: 'https://agent.example',
      // Only https pages are kept from what a client says about itself
      logoUri: null,
      redirectUris: ['https://agent.example/callback'],
    });
    await service.find(DOCUMENT_URL);
    expect(fetchDocument).toHaveBeenCalledTimes(1);
  });

  it('refuses a document that names another client or a secret', async () => {
    const service = new OAuthClientsService(
      fakePrisma() as unknown as PrismaService,
    );
    fetchDocument.mockResolvedValueOnce({
      client_id: 'https://other.example/client.json',
      redirect_uris: ['https://agent.example/callback'],
    });
    expect(await service.find(DOCUMENT_URL)).toBeNull();

    fetchDocument.mockResolvedValueOnce({
      client_id: DOCUMENT_URL,
      token_endpoint_auth_method: 'client_secret_basic',
      redirect_uris: ['https://agent.example/callback'],
    });
    expect(await service.find(DOCUMENT_URL)).toBeNull();
  });

  it('keeps a known client while its document is unreachable', async () => {
    const stale = {
      clientId: DOCUMENT_URL,
      name: 'Agent',
      redirectUris: ['https://agent.example/callback'],
      metadataFetchedAt: new Date('2026-01-01'),
    } as OAuthClient;
    const service = new OAuthClientsService(
      fakePrisma([stale]) as unknown as PrismaService,
    );
    fetchDocument.mockRejectedValue(new Error('Timed out'));
    expect(await service.find(DOCUMENT_URL)).toBe(stale);
  });
});
