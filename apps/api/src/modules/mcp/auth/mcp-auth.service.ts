import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';

import { McpGrant, OAuthClient, OAuthResource } from '@openathlete/database';
import {
  CreatePersonalTokenDto,
  CreatedPersonalToken,
  McpConnection,
  OAuthScope,
} from '@openathlete/shared';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { scopesFor } from './scopes';
import { TOKEN_PREFIX, generateToken, hashToken } from './tokens';

/** Who a request with a token acts for, and what it may do */
export type McpPrincipal = {
  user: AuthUser;
  scopes: OAuthScope[];
  grantId: number;
};

const DAY_MS = 24 * 3600 * 1000;
/** lastUsedAt is written at most this often per grant */
const TOUCH_INTERVAL_MS = 60 * 1000;
const MAX_PERSONAL_TOKENS = 20;

const USER_SELECT = {
  userId: true,
  email: true,
  athlete: { select: { athleteId: true } },
  coachAthletes: { select: { athleteId: true } },
} as const;

function toConnection(
  grant: McpGrant & { client: Pick<OAuthClient, 'clientUri'> | null },
): McpConnection {
  return {
    mcpGrantId: grant.mcpGrantId,
    kind: grant.kind,
    name: grant.name,
    scopes: grant.scopes as OAuthScope[],
    tokenHint: grant.tokenHint,
    clientUri: grant.client?.clientUri ?? null,
    createdAt: grant.createdAt,
    lastUsedAt: grant.lastUsedAt,
    expiresAt: grant.expiresAt,
  };
}

/**
 * Turns the bearer token of an MCP request into the user it acts for, and
 * manages the accesses a user gave: personal tokens and OAuth clients.
 */
@Injectable()
export class McpAuthService {
  private readonly logger = new Logger(McpAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  /**
   * The user a token acts for on a resource. An OAuth access token works
   * only on the resource it was issued for, and personal tokens only on MCP.
   */
  async authenticate(
    token: string,
    resource: OAuthResource = 'MCP',
  ): Promise<McpPrincipal | null> {
    const now = new Date();
    let grant: (McpGrant & { user: AuthUser }) | null = null;

    if (token.startsWith(TOKEN_PREFIX.personal) && resource === 'MCP') {
      grant = await this.prisma.mcpGrant.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { user: { select: USER_SELECT } },
      });
      if (grant?.expiresAt && grant.expiresAt < now) grant = null;
    } else if (token.startsWith(TOKEN_PREFIX.access)) {
      const access = await this.prisma.mcpToken.findUnique({
        where: { tokenHash: hashToken(token) },
        include: {
          grant: { include: { user: { select: USER_SELECT } } },
        },
      });
      if (
        access?.type === 'ACCESS' &&
        access.resource === resource &&
        access.expiresAt > now
      ) {
        grant = access.grant;
      }
    }
    if (!grant) return null;

    if (
      !grant.lastUsedAt ||
      now.getTime() - grant.lastUsedAt.getTime() > TOUCH_INTERVAL_MS
    ) {
      // Not awaited: a failed write must not fail the request
      this.prisma.mcpGrant
        .updateMany({
          where: { mcpGrantId: grant.mcpGrantId },
          data: { lastUsedAt: now },
        })
        .catch((error: Error) =>
          this.logger.warn(`lastUsedAt not saved: ${error.message}`),
        );
    }

    const scopes = scopesFor(grant.scopes, resource);
    if (!scopes.length) return null;
    return { user: grant.user, scopes, grantId: grant.mcpGrantId };
  }

  async list(user: AuthUser): Promise<McpConnection[]> {
    const grants = await this.prisma.mcpGrant.findMany({
      where: { userId: user.userId },
      include: { client: { select: { clientUri: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return grants.map(toConnection);
  }

  async createPersonalToken(
    user: AuthUser,
    dto: CreatePersonalTokenDto,
  ): Promise<CreatedPersonalToken> {
    const count = await this.prisma.mcpGrant.count({
      where: { userId: user.userId, kind: 'PERSONAL_TOKEN' },
    });
    if (count >= MAX_PERSONAL_TOKENS) {
      throw new BadRequestException(
        `At most ${MAX_PERSONAL_TOKENS} tokens: revoke one first`,
      );
    }
    const token = generateToken(TOKEN_PREFIX.personal);
    const grant = await this.prisma.mcpGrant.create({
      data: {
        kind: 'PERSONAL_TOKEN',
        name: dto.name,
        scopes: [...new Set(dto.scopes)],
        tokenHash: hashToken(token),
        tokenHint: token.slice(-4),
        expiresAt: dto.expiresInDays
          ? new Date(Date.now() + dto.expiresInDays * DAY_MS)
          : null,
        userId: user.userId,
      },
      include: { client: { select: { clientUri: true } } },
    });
    await this.analytics?.capture(user.userId, 'mcp_connected', {
      kind: 'PERSONAL_TOKEN',
      client: 'other',
      resource: 'MCP',
      is_new: true,
    });
    return { connection: toConnection(grant), token };
  }

  /** Removes an access with its tokens: the agent loses access at once */
  async revoke(user: AuthUser, mcpGrantId: number): Promise<void> {
    const { count } = await this.prisma.mcpGrant.deleteMany({
      where: { mcpGrantId, userId: user.userId },
    });
    if (!count) {
      throw new NotFoundException('Connection not found');
    }
  }
}
