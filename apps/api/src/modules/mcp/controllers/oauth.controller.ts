import { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  OAuthAuthorizeDetails,
  OAuthAuthorizeRequest,
  OAuthDecisionDto,
  OAuthDecisionResponse,
  oauthAuthorizeRequestSchema,
  oauthDecisionDtoSchema,
} from '@openathlete/shared';

import { RATE_LIMITS } from 'src/common/security/rate-limits';
import { JwtUser } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { OAuthClientsService } from '../auth/oauth-clients.service';
import { AuthorizeError, OAuthError } from '../auth/oauth-error';
import { ClientCredentials, OAuthService } from '../auth/oauth.service';

/** client_id and client_secret, from HTTP Basic or the form (RFC 6749 2.3.1) */
function clientCredentials(
  req: Request,
  body: Record<string, unknown>,
): ClientCredentials {
  const header = req.headers.authorization;
  if (header?.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator > 0) {
      return {
        clientId: decodeURIComponent(decoded.slice(0, separator)),
        clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
      };
    }
  }
  return {
    clientId: typeof body.client_id === 'string' ? body.client_id : undefined,
    clientSecret:
      typeof body.client_secret === 'string' ? body.client_secret : undefined,
  };
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );

/**
 * OAuth 2.1 endpoints of the MCP server. The user approves on the web app's
 * consent page, which calls the two JWT routes; agents call the others.
 */
@ApiTags('MCP')
@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oauth: OAuthService,
    private readonly clients: OAuthClientsService,
  ) {}

  private sendError(res: Response, error: unknown) {
    if (error instanceof OAuthError) {
      res.status(error.status).set('Cache-Control', 'no-store').json(error);
      return;
    }
    throw error;
  }

  /**
   * Checks the request, then hands it to the consent page. An error the
   * client can handle goes back to it; one with an untrusted redirect URI
   * is shown here.
   */
  @ApiExcludeEndpoint()
  @Get('authorize')
  async authorize(
    @Query() query: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const parsed = oauthAuthorizeRequestSchema.safeParse(query);
    try {
      if (!parsed.success) {
        throw new AuthorizeError(
          'invalid_request',
          'client_id, redirect_uri and response_type are required',
          null,
        );
      }
      await this.oauth.validate(parsed.data);
    } catch (error) {
      if (!(error instanceof AuthorizeError)) throw error;
      if (error.redirectUri) {
        return res.redirect(
          302,
          this.oauth.redirect(error.redirectUri, {
            error: error.code,
            error_description: error.description,
            state: error.state,
          }),
        );
      }
      return res
        .status(400)
        .type('html')
        .send(
          `<!doctype html><meta charset="utf-8"><title>OpenAthlete</title>` +
            `<p>This connection request is invalid: ${escapeHtml(error.description)}.</p>`,
        );
    }
    const consent = new URL(this.oauth.consentPage);
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) consent.searchParams.set(key, value);
    }
    res.redirect(302, consent.toString());
  }

  @ApiOperation({ summary: 'Details of an authorization request, for consent' })
  @UseGuards(AuthGuard('jwt'))
  @Get('authorize/details')
  async details(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(oauthAuthorizeRequestSchema))
    query: OAuthAuthorizeRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OAuthAuthorizeDetails | void> {
    try {
      return await this.oauth.details(user, query);
    } catch (error) {
      this.sendError(res, error);
    }
  }

  @ApiOperation({ summary: 'Approve or decline an authorization request' })
  @UseGuards(AuthGuard('jwt'))
  @Post('authorize')
  @HttpCode(200)
  async decide(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(oauthDecisionDtoSchema)) body: OAuthDecisionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OAuthDecisionResponse | void> {
    const { approve, ...request } = body;
    try {
      return { redirectTo: await this.oauth.decide(user, request, approve) };
    } catch (error) {
      if (error instanceof AuthorizeError && error.redirectUri) {
        return {
          redirectTo: this.oauth.redirect(error.redirectUri, {
            error: error.code,
            error_description: error.description,
            state: error.state,
          }),
        };
      }
      this.sendError(res, error);
    }
  }

  @ApiExcludeEndpoint()
  @Throttle(RATE_LIMITS.oauthToken)
  @Post('token')
  @HttpCode(200)
  async token(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });
    try {
      return await this.oauth.token(
        body ?? {},
        clientCredentials(req, body ?? {}),
      );
    } catch (error) {
      if (error instanceof OAuthError && error.status === 401) {
        res.set('WWW-Authenticate', 'Basic realm="OpenAthlete"');
      }
      this.sendError(res, error);
    }
  }

  /** Dynamic Client Registration (RFC 7591) */
  @ApiExcludeEndpoint()
  @Throttle(RATE_LIMITS.oauthRegister)
  @Post('register')
  @HttpCode(201)
  async register(
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.set('Cache-Control', 'no-store');
    try {
      return await this.clients.register(body ?? {});
    } catch (error) {
      this.sendError(res, error);
    }
  }

  /** Token revocation (RFC 7009) */
  @ApiExcludeEndpoint()
  @Throttle(RATE_LIMITS.oauthToken)
  @Post('revoke')
  @HttpCode(200)
  async revoke(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      await this.oauth.revoke(
        typeof body?.token === 'string' ? body.token : undefined,
        clientCredentials(req, body ?? {}),
      );
      return {};
    } catch (error) {
      this.sendError(res, error);
    }
  }
}
