import { z } from 'zod';

/**
 * What an agent connected through MCP may do: `read` covers every tool that
 * only reads, `write` the tools that change the calendar, periods, metrics
 * and zones. Writing implies nothing about reading: agents ask for both.
 */
export const MCP_SCOPES = ['read', 'write'] as const;
export const mcpScopeSchema = z.enum(MCP_SCOPES);
export type McpScope = z.infer<typeof mcpScopeSchema>;

/** Lifetimes offered for a personal token, in days; null never expires */
export const PERSONAL_TOKEN_LIFETIMES = [30, 90, 365] as const;

export const createPersonalTokenDtoSchema = z.object({
  name: z.string().trim().min(1).max(60),
  scopes: z.array(mcpScopeSchema).min(1),
  expiresInDays: z
    .union([
      z.literal(PERSONAL_TOKEN_LIFETIMES[0]),
      z.literal(PERSONAL_TOKEN_LIFETIMES[1]),
      z.literal(PERSONAL_TOKEN_LIFETIMES[2]),
    ])
    .nullable(),
});

export type CreatePersonalTokenDto = z.infer<
  typeof createPersonalTokenDtoSchema
>;

/** An agent with access: an approved OAuth client or a personal token */
export type McpConnection = {
  mcpGrantId: number;
  kind: 'OAUTH' | 'PERSONAL_TOKEN';
  name: string;
  scopes: McpScope[];
  /** Personal token: its last characters */
  tokenHint: string | null;
  /** OAuth client: its website */
  clientUri: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
};

/** Shown once, when the token is created */
export type CreatedPersonalToken = {
  connection: McpConnection;
  token: string;
};

/** Where agents connect, shown in the settings */
export type McpServerInfo = {
  url: string;
};

/** The query of an OAuth authorization request, as the client sent it */
export const oauthAuthorizeRequestSchema = z.object({
  response_type: z.string(),
  client_id: z.string().min(1).max(2048),
  redirect_uri: z.string().min(1).max(2048),
  code_challenge: z.string().optional(),
  code_challenge_method: z.string().optional(),
  scope: z.string().max(200).optional(),
  state: z.string().max(2048).optional(),
  resource: z.string().max(2048).optional(),
});

export type OAuthAuthorizeRequest = z.infer<typeof oauthAuthorizeRequestSchema>;

/** What the consent page shows about a valid authorization request */
export type OAuthAuthorizeDetails = {
  clientName: string;
  clientUri: string | null;
  logoUri: string | null;
  /** Host the user is sent back to, so they can tell who asks */
  redirectHost: string;
  scopes: McpScope[];
  /** The client already has access: approving updates it */
  alreadyConnected: boolean;
};

export const oauthDecisionDtoSchema = oauthAuthorizeRequestSchema.extend({
  approve: z.boolean(),
});

export type OAuthDecisionDto = z.infer<typeof oauthDecisionDtoSchema>;

/** Where the consent page sends the browser: back to the client */
export type OAuthDecisionResponse = {
  redirectTo: string;
};
