import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';

import {
  All,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { RATE_LIMITS } from 'src/common/security/rate-limits';

import { McpAuthService } from '../auth/mcp-auth.service';
import { McpUrls, mcpUrls } from '../mcp-urls';
import { McpServerFactory } from '../server/mcp-server.factory';

/**
 * The MCP endpoint (Streamable HTTP), stateless: each POST carries its
 * bearer token and gets its own server instance, so any API instance can
 * answer any request and nothing is kept between them.
 */
@ApiExcludeController()
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);
  private readonly urls: McpUrls;

  constructor(
    private readonly auth: McpAuthService,
    private readonly servers: McpServerFactory,
    config: ConfigService<ApiEnvSchemaType, true>,
  ) {
    this.urls = mcpUrls(config);
  }

  /** 401 with where to sign in (RFC 9728 5.1), so clients start OAuth */
  private unauthorized(res: Response, error?: string) {
    const challenge = [
      `resource_metadata="${this.urls.resourceMetadata}"`,
      'scope="read write"',
      ...(error
        ? [
            `error="${error}"`,
            'error_description="The access token is invalid, expired or revoked"',
          ]
        : []),
    ].join(', ');
    res
      .status(401)
      .set('WWW-Authenticate', `Bearer ${challenge}`)
      .json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Authentication required' },
        id: null,
      });
  }

  @Throttle(RATE_LIMITS.mcp)
  @Post()
  async handle(@Req() req: Request, @Res() res: Response) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return this.unauthorized(res);
    }
    const principal = await this.auth.authenticate(header.slice(7).trim());
    if (!principal) {
      return this.unauthorized(res, 'invalid_token');
    }

    const server = this.servers.create(principal);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      // Plain JSON answers: no tool streams progress, and proxies and
      // clients handle JSON best
      enableJsonResponse: true,
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      this.logger.error(`MCP request failed: ${(error as Error).message}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
      }
    }
  }

  /** No sessions, so no stream to open (GET) or session to end (DELETE) */
  @All()
  @HttpCode(405)
  notAllowed(@Res() res: Response) {
    res
      .status(405)
      .set('Allow', 'POST')
      .json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed: use POST' },
        id: null,
      });
  }
}
