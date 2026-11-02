import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CoreModule } from '../core';
import { OAuthClientsService } from './auth/oauth-clients.service';
import { OAuthTokensModule } from './auth/oauth-tokens.module';
import { OAuthService } from './auth/oauth.service';
import { McpConnectionsController } from './controllers/mcp-connections.controller';
import { McpController } from './controllers/mcp.controller';
import { OAuthController } from './controllers/oauth.controller';
import { WellKnownController } from './controllers/well-known.controller';
import { McpServerFactory } from './server/mcp-server.factory';

/**
 * The MCP server: AI agents (Claude, ChatGPT, Cursor, custom ones) read and
 * plan the training of the user who connected them, through OAuth or a
 * personal token.
 */
@Module({
  imports: [AuthModule, CoreModule, OAuthTokensModule],
  controllers: [
    // Before McpController: /mcp/connections must not reach its catch-all
    McpConnectionsController,
    McpController,
    OAuthController,
    WellKnownController,
  ],
  providers: [OAuthClientsService, OAuthService, McpServerFactory],
})
export class McpModule {}
