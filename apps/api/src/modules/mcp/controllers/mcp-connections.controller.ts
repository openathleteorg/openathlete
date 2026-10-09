import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  ApiEnvSchemaType,
  CreatePersonalTokenDto,
  CreatedPersonalToken,
  McpConnection,
  McpServerInfo,
  createPersonalTokenDtoSchema,
} from '@openathlete/shared';

import { JwtUser } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { McpAuthService } from '../auth/mcp-auth.service';
import { mcpUrls } from '../mcp-urls';

/** The user's AI agents: what can reach their data, and personal tokens */
@ApiTags('MCP')
@UseGuards(AuthGuard('jwt'))
@Controller('mcp')
export class McpConnectionsController {
  private readonly info: McpServerInfo;

  constructor(
    private readonly auth: McpAuthService,
    config: ConfigService<ApiEnvSchemaType, true>,
  ) {
    this.info = { url: mcpUrls(config).resource };
  }

  @ApiOperation({ summary: 'Address of the MCP server' })
  @Get('info')
  getInfo(): McpServerInfo {
    return this.info;
  }

  @ApiOperation({ summary: 'Agents with access to my data' })
  @Get('connections')
  list(@JwtUser() user: AuthUser): Promise<McpConnection[]> {
    return this.auth.list(user);
  }

  @ApiOperation({ summary: 'Create a personal token, shown once' })
  @ApiResponse({ status: 201 })
  @Post('tokens')
  createToken(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPersonalTokenDtoSchema))
    body: CreatePersonalTokenDto,
  ): Promise<CreatedPersonalToken> {
    return this.auth.createPersonalToken(user, body);
  }

  @ApiOperation({ summary: 'Revoke an agent access or a personal token' })
  @Delete('connections/:mcpGrantId')
  @HttpCode(204)
  revoke(
    @JwtUser() user: AuthUser,
    @Param('mcpGrantId', ParseIntPipe) mcpGrantId: number,
  ): Promise<void> {
    return this.auth.revoke(user, mcpGrantId);
  }
}
