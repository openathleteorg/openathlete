import { ForbiddenException } from '@nestjs/common';

import { TokenType } from '@openathlete/database';

import { OidcService } from './oidc.service';

const claims = jest.fn();
const authorizationCodeGrant = jest.fn();

jest.mock('openid-client', () => ({
  discovery: jest.fn().mockResolvedValue({}),
  None: jest.fn(),
  allowInsecureRequests: jest.fn(),
  randomState: () => 'state',
  randomNonce: () => 'nonce',
  randomPKCECodeVerifier: () => 'verifier',
  calculatePKCECodeChallenge: jest.fn().mockResolvedValue('challenge'),
  buildAuthorizationUrl: (_: unknown, params: Record<string, string>) =>
    new URL(`https://idp.example.org/authorize?${new URLSearchParams(params)}`),
  authorizationCodeGrant: (...args: unknown[]) =>
    authorizationCodeGrant(...args),
}));

const env: Record<string, string> = {
  OIDC_ISSUER: 'https://idp.example.org',
  OIDC_CLIENT_ID: 'openathlete',
  OIDC_CLIENT_SECRET: 'secret',
  JWT_SECRET_KEY: 'test-jwt-secret-at-least-32-characters-long',
  API_PUBLIC_URL: 'https://api.example.org',
  APP_URL: 'https://app.example.org',
};

function setup() {
  const auth = {
    providerAccount: jest
      .fn()
      .mockResolvedValue({ userId: 3, email: 'ana@example.com' }),
    sessionFor: jest.fn().mockReturnValue({ accessToken: 'a' }),
  };
  const tokens = {
    createToken: jest.fn().mockResolvedValue({ token: 'one-time' }),
    consumeToken: jest.fn(),
  };
  const service = new OidcService(
    { get: (key: string) => env[key] } as never,
    auth as never,
    tokens as never,
  );
  return { service, auth, tokens };
}

async function signIn(service: OidcService) {
  const { url, cookie } = await service.start({
    invitationToken: 'invite',
    language: 'FR',
  });
  const callback = new URL(service.redirectUri);
  callback.search = 'code=abc&state=state';
  return {
    url: new URL(url),
    result: await service.callback(callback, cookie),
  };
}

describe('OidcService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationCodeGrant.mockResolvedValue({ claims });
    claims.mockReturnValue({
      email: 'Ana@Example.com',
      email_verified: true,
      given_name: 'Ana',
      family_name: 'Silva',
    });
  });

  it('returns the attempt that started the verified provider response', async () => {
    const { service } = setup();
    const attempt = '551694c1-9c83-4c1e-bbf9-9a191f33b2fb';
    const { cookie } = await service.start({ attempt });
    const callback = new URL(service.redirectUri);
    callback.search = 'code=abc&state=state';

    await expect(service.callback(callback, cookie)).resolves.toEqual({
      code: 'one-time',
      attempt,
    });
  });

  it('sends the user to the provider with PKCE', async () => {
    const { service } = setup();
    const { url } = await signIn(service);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('redirect_uri')).toBe(service.redirectUri);
  });

  it('signs in the account of the verified address', async () => {
    const { service, auth, tokens } = setup();
    const { result } = await signIn(service);
    expect(result).toEqual({ code: 'one-time' });
    expect(authorizationCodeGrant).toHaveBeenCalledWith(
      {},
      expect.any(URL),
      expect.objectContaining({
        pkceCodeVerifier: 'verifier',
        expectedState: 'state',
        expectedNonce: 'nonce',
      }),
    );
    // The invitation and language went through the provider in the cookie
    expect(auth.providerAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'Ana@Example.com',
        firstName: 'Ana',
        lastName: 'Silva',
        invitationToken: 'invite',
        language: 'FR',
      }),
    );
    expect(tokens.createToken).toHaveBeenCalledWith(
      { userId: 3 },
      TokenType.OIDC_LOGIN,
    );
  });

  it('refuses an address the provider did not verify', async () => {
    claims.mockReturnValue({ email: 'ana@example.com', email_verified: false });
    const { service, auth } = setup();
    expect((await signIn(service)).result).toEqual({
      error: 'email_unverified',
    });
    expect(auth.providerAccount).not.toHaveBeenCalled();
  });

  it('refuses a callback without its state cookie', async () => {
    const { service } = setup();
    await expect(
      service.callback(new URL(service.redirectUri), 'forged'),
    ).resolves.toEqual({ error: 'failed' });
    expect(authorizationCodeGrant).not.toHaveBeenCalled();
  });

  it.each([
    ['SIGNUP_CLOSED', 'signup_closed'],
    ['SIGNUP_INVITE_ONLY', 'signup_invite_only'],
  ])('tells the user when sign-up is %s', async (reason, error) => {
    const { service, auth } = setup();
    auth.providerAccount.mockRejectedValue(new ForbiddenException(reason));
    expect((await signIn(service)).result).toEqual({ error });
  });

  it('opens a session for a code once', async () => {
    const { service, auth, tokens } = setup();
    tokens.consumeToken
      .mockResolvedValueOnce({ userId: 3, email: 'ana@example.com' })
      .mockResolvedValueOnce(null);
    await expect(service.exchange('one-time')).resolves.toEqual({
      accessToken: 'a',
    });
    await expect(service.exchange('one-time')).resolves.toBeNull();
    expect(tokens.consumeToken).toHaveBeenCalledWith(
      'one-time',
      TokenType.OIDC_LOGIN,
    );
    expect(auth.sessionFor).toHaveBeenCalledTimes(1);
  });
});
