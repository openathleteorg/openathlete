import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { OAuthService } from '../auth/oauth.service';

/**
 * Discovery documents. Clients look them up at the root of the API, or with
 * the path of the issuer or resource appended (RFC 8414, RFC 9728): under
 * Docker Compose the web app forwards /.well-known/oauth-* here, so both
 * forms answer.
 */
@ApiExcludeController()
@Controller('.well-known')
export class WellKnownController {
  private readonly openAiAppsChallenge?: string;

  constructor(
    private readonly oauth: OAuthService,
    config: ConfigService<ApiEnvSchemaType, true>,
  ) {
    this.openAiAppsChallenge =
      config.get('OPENAI_APPS_CHALLENGE_TOKEN', { infer: true }) || undefined;
  }

  @Get(['oauth-protected-resource', 'oauth-protected-resource/*path'])
  @Header('Cache-Control', 'public, max-age=3600')
  protectedResource(@Param('path') path?: string | string[]) {
    // The resource's path follows: activity-import, or api/activity-import
    // when the API sits under the web app's /api
    const segments = Array.isArray(path) ? path : (path?.split('/') ?? []);
    return segments.at(-1) === 'activity-import'
      ? this.oauth.importResourceMetadata()
      : this.oauth.resourceMetadata();
  }

  @Get(['oauth-authorization-server', 'oauth-authorization-server/*path'])
  @Header('Cache-Control', 'public, max-age=3600')
  authorizationServer() {
    return this.oauth.metadata();
  }

  /** Proves to OpenAI that we own the domain of the app listed in ChatGPT */
  @Get('openai-apps-challenge')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  openAiAppsChallengeToken(): string {
    if (!this.openAiAppsChallenge) throw new NotFoundException();
    return this.openAiAppsChallenge;
  }
}
