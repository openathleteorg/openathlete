import client, { routes } from '@/utils/axios';

import {
  CreatePersonalTokenDto,
  CreatedPersonalToken,
  McpConnection,
  McpServerInfo,
  OAuthAuthorizeDetails,
  OAuthAuthorizeRequest,
  OAuthDecisionResponse,
} from '@openathlete/shared';

export class McpAPI {
  static async getInfo(): Promise<McpServerInfo> {
    const res = await client.get(routes.mcp.info);
    return res.data;
  }

  static async getConnections(): Promise<McpConnection[]> {
    const res = await client.get(routes.mcp.connections);
    return res.data;
  }

  static async createPersonalToken(
    body: CreatePersonalTokenDto,
  ): Promise<CreatedPersonalToken> {
    const res = await client.post(routes.mcp.tokens, body);
    return res.data;
  }

  static async revokeConnection(mcpGrantId: number): Promise<void> {
    await client.delete(routes.mcp.connection(mcpGrantId));
  }

  static async getAuthorizeDetails(
    request: OAuthAuthorizeRequest,
  ): Promise<OAuthAuthorizeDetails> {
    const res = await client.get(routes.mcp.authorizeDetails, {
      params: request,
    });
    return res.data;
  }

  static async decide(
    request: OAuthAuthorizeRequest,
    approve: boolean,
  ): Promise<OAuthDecisionResponse> {
    const res = await client.post(routes.mcp.authorize, {
      ...request,
      approve,
    });
    return res.data;
  }
}
