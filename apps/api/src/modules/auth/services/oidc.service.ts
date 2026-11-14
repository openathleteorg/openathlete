import { sign, verify } from 'jsonwebtoken';
import type * as OpenIdClient from 'openid-client';

import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TokenType } from '@openathlete/database';
import {
  ApiEnvSchemaType,
  AuthResponseDto,
  CreateAccountDto,
  OidcError,
} from '@openathlete/shared';

import { mcpUrls } from 'src/modules/mcp/mcp-urls';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';

const STATE_TTL_S = 10 * 60;
const STATE_TYPE = 'oidc-state';
export const OIDC_STATE_COOKIE = 'oa_oidc';

/** What a sign-in carries through the provider, in a signed cookie */
type PendingSignIn = {
  state: string;
  nonce: string;
  verifier: string;
  invitationToken?: string;
  coachInvitationToken?: string;
  clubJoinToken?: string;
  language?: CreateAccountDto['language'];
};

export type OidcStart = Omit<PendingSignIn, 'state' | 'nonce' | 'verifier'>;

/** How a sign-in ends: back to the web app with a one-time code or an error */
export type OidcResult = { code: string } | { error: OidcError };

// openid-client is ESM only: loaded when first needed, which also keeps it
// out of instances that don't use OpenID Connect
let library: Promise<typeof OpenIdClient> | undefined;
const openIdClient = () => (library ??= import('openid-client'));

/**
 * Sign-in through the instance's OpenID Connect provider (Authentik,
 * Keycloak, Authelia...): authorization code with PKCE, run by the API. The
 * provider's verified address names the account, created on first sign-in
 * within the sign-up mode; the web app then exchanges a one-time code for
 * its session.
 */
@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private configuration?: Promise<OpenIdClient.Configuration>;

  constructor(
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
  ) {}

  get enabled(): boolean {
    return Boolean(
      this.config.get('OIDC_ISSUER') && this.config.get('OIDC_CLIENT_ID'),
    );
  }

  /** What the sign-in page shows: null when OpenID Connect is off */
  info(): { name: string } | null {
    return this.enabled
      ? { name: this.config.get('OIDC_NAME') || 'SSO' }
      : null;
  }

  /** Where the provider sends the user back, to register there */
  get redirectUri(): string {
    return `${mcpUrls(this.config).issuer}/auth/oidc/callback`;
  }

  /** The path the state cookie is sent to: the callback's */
  get cookiePath(): string {
    return new URL(this.redirectUri).pathname.replace(/\/callback$/, '');
  }

  /** Its own key: a sign-in state can never pass for a session token */
  private get stateKey(): string {
    return `${this.config.get('JWT_SECRET_KEY')}:${STATE_TYPE}`;
  }

  get secureCookie(): boolean {
    return new URL(this.redirectUri).protocol === 'https:';
  }

  private async provider(): Promise<OpenIdClient.Configuration> {
    if (!this.enabled) throw new NotFoundException();
    this.configuration ??= (async () => {
      const client = await openIdClient();
      const issuer = new URL(this.config.get('OIDC_ISSUER')!);
      const secret = this.config.get('OIDC_CLIENT_SECRET');
      return client.discovery(
        issuer,
        this.config.get('OIDC_CLIENT_ID')!,
        secret || undefined,
        secret ? undefined : client.None(),
        // The administrator chose this address: an http provider on their
        // own network is theirs to allow
        issuer.protocol === 'http:'
          ? { execute: [client.allowInsecureRequests] }
          : undefined,
      );
    })().catch((error: unknown) => {
      // A provider that was down is tried again on the next sign-in
      this.configuration = undefined;
      throw error;
    });
    return this.configuration;
  }

  /** The provider's authorization URL, and the signed state for the cookie */
  async start(params: OidcStart): Promise<{ url: string; cookie: string }> {
    const provider = await this.provider();
    const client = await openIdClient();
    const pending: PendingSignIn = {
      ...params,
      state: client.randomState(),
      nonce: client.randomNonce(),
      verifier: client.randomPKCECodeVerifier(),
    };
    const url = client.buildAuthorizationUrl(provider, {
      redirect_uri: this.redirectUri,
      scope: 'openid email profile',
      response_type: 'code',
      code_challenge: await client.calculatePKCECodeChallenge(pending.verifier),
      code_challenge_method: 'S256',
      state: pending.state,
      nonce: pending.nonce,
    });
    const cookie = sign({ ...pending, type: STATE_TYPE }, this.stateKey, {
      algorithm: 'HS256',
      expiresIn: STATE_TTL_S,
    });
    return { url: url.href, cookie };
  }

  /**
   * The provider sent the user back: checks the answer against the state
   * cookie, signs in the account of the verified address, and returns a
   * one-time code for the web app.
   */
  async callback(callbackUrl: URL, cookie?: string): Promise<OidcResult> {
    let pending: PendingSignIn;
    try {
      const payload = verify(cookie ?? '', this.stateKey, {
        algorithms: ['HS256'],
      }) as unknown as PendingSignIn & { type?: string };
      if (payload.type !== STATE_TYPE) throw new Error('Not a sign-in state');
      pending = payload;
    } catch {
      this.logger.warn('OpenID Connect callback without a valid state');
      return { error: 'failed' };
    }

    let claims: OpenIdClient.IDToken;
    try {
      const provider = await this.provider();
      const client = await openIdClient();
      const tokens = await client.authorizationCodeGrant(
        provider,
        callbackUrl,
        {
          pkceCodeVerifier: pending.verifier,
          expectedState: pending.state,
          expectedNonce: pending.nonce,
          idTokenExpected: true,
        },
      );
      claims = tokens.claims()!;
    } catch (error) {
      this.logger.warn(
        `OpenID Connect sign-in failed: ${(error as Error).message}`,
      );
      return { error: 'failed' };
    }

    const email = typeof claims.email === 'string' ? claims.email : '';
    // The address names the account: only one the provider checked
    if (!email || claims.email_verified === false) {
      return { error: 'email_unverified' };
    }

    try {
      const user = await this.auth.providerAccount({
        email,
        name: typeof claims.name === 'string' ? claims.name : undefined,
        firstName:
          typeof claims.given_name === 'string' ? claims.given_name : undefined,
        lastName:
          typeof claims.family_name === 'string'
            ? claims.family_name
            : undefined,
        invitationToken: pending.invitationToken,
        coachInvitationToken: pending.coachInvitationToken,
        clubJoinToken: pending.clubJoinToken,
        language: pending.language,
      });
      const { token } = await this.tokens.createToken(
        { userId: user.userId },
        TokenType.OIDC_LOGIN,
      );
      return { code: token };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        const reason = String(
          (error.getResponse() as { message?: string }).message ?? '',
        );
        if (reason === 'SIGNUP_CLOSED') return { error: 'signup_closed' };
        if (reason === 'SIGNUP_INVITE_ONLY') {
          return { error: 'signup_invite_only' };
        }
      }
      this.logger.error(
        `OpenID Connect account sign-in failed: ${(error as Error).message}`,
      );
      return { error: 'failed' };
    }
  }

  /** The web app's session for a one-time code, which is then spent */
  async exchange(code: string): Promise<AuthResponseDto | null> {
    const user = await this.tokens.consumeToken(code, TokenType.OIDC_LOGIN);
    return user ? this.auth.sessionFor(user) : null;
  }
}
