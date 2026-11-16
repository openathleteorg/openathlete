import type { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  ApiEnvSchemaType,
  AuthResponseDto,
  OidcExchangeDto,
  emailLanguageSchema,
  oidcExchangeDtoSchema,
} from '@openathlete/shared';

import { RATE_LIMITS } from 'src/common/security/rate-limits';

import { OIDC_STATE_COOKIE, OidcService } from '../services/oidc.service';

const startQuerySchema = z.object({
  invitation: z.string().max(200).optional(),
  coachInvitation: z.string().max(200).optional(),
  clubJoin: z.string().max(200).optional(),
  language: emailLanguageSchema.optional(),
});

function cookieValue(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

/**
 * Single sign-on through the instance's OpenID Connect provider. The web app
 * sends the user to /auth/oidc, the provider brings them back to the
 * callback, which hands the web app a one-time code to exchange.
 */
@ApiTags('Authentication')
@Controller('auth/oidc')
export class OidcController {
  constructor(
    private readonly oidc: OidcService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  private cookieOptions(maxAgeMs: number) {
    return {
      httpOnly: true,
      // Lax: the provider's redirect back is a top-level navigation
      sameSite: 'lax' as const,
      secure: this.oidc.secureCookie,
      path: this.oidc.cookiePath,
      maxAge: maxAgeMs,
    };
  }

  @Throttle(RATE_LIMITS.login)
  @Get()
  @ApiOperation({
    summary: 'Start an OpenID Connect sign-in',
    description:
      "Redirects to the instance's OpenID Connect provider. 404 when OIDC_ISSUER and OIDC_CLIENT_ID are not set. Optional invitation tokens and language apply if the sign-in creates the account.",
  })
  @ApiResponse({ status: 302, description: 'To the provider' })
  async start(
    @Query(new ZodValidationPipe(startQuerySchema))
    query: z.infer<typeof startQuerySchema>,
    @Res() res: Response,
  ) {
    const { url, cookie } = await this.oidc.start({
      invitationToken: query.invitation,
      coachInvitationToken: query.coachInvitation,
      clubJoinToken: query.clubJoin,
      language: query.language,
    });
    res
      .cookie(OIDC_STATE_COOKIE, cookie, this.cookieOptions(10 * 60 * 1000))
      .redirect(302, url);
  }

  @Throttle(RATE_LIMITS.login)
  @Get('callback')
  @ApiOperation({
    summary: 'OpenID Connect redirect URI',
    description:
      'Register this URL at the provider. Redirects to the web app with a one-time code, or an error, in the fragment.',
  })
  @ApiResponse({ status: 302, description: 'To the web app' })
  async callback(@Req() req: Request, @Res() res: Response) {
    const cookie = cookieValue(req, OIDC_STATE_COOKIE);
    // The registered redirect URI with the provider's answer: behind the
    // web app's /api the request path lacks the prefix the provider knows
    const callbackUrl = new URL(this.oidc.redirectUri);
    callbackUrl.search = new URL(req.originalUrl, 'http://localhost').search;
    const result = await this.oidc.callback(callbackUrl, cookie);
    const target = new URL(`${this.config.get('APP_URL')}/auth/sso`);
    // In the fragment: it never reaches a server log or a Referer
    target.hash = new URLSearchParams(result).toString();
    res
      .clearCookie(OIDC_STATE_COOKIE, { path: this.oidc.cookiePath })
      .redirect(302, target.href);
  }

  @Throttle(RATE_LIMITS.login)
  @Post('exchange')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Exchange a one-time OpenID Connect code for the session',
    description:
      'The code is valid for one minute and works once. Returns the access and refresh tokens, like password login.',
  })
  @ApiResponse({ status: 200, description: 'Signed in' })
  @ApiResponse({ status: 401, description: 'Unknown, expired or used code' })
  async exchange(
    @Body(new ZodValidationPipe(oidcExchangeDtoSchema)) body: OidcExchangeDto,
  ): Promise<AuthResponseDto> {
    const session = await this.oidc.exchange(body.code);
    if (!session) throw new UnauthorizedException();
    return session;
  }
}
