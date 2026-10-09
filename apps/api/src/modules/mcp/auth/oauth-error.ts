/**
 * An OAuth error, answered as `{ error, error_description }` (RFC 6749 5.2,
 * RFC 7591 3.2.2). invalid_client is a 401, the others a 400.
 */
export class OAuthError extends Error {
  constructor(
    readonly code: string,
    readonly description: string,
    readonly status = code === 'invalid_client' ? 401 : 400,
  ) {
    super(description);
  }

  toJSON() {
    return { error: this.code, error_description: this.description };
  }
}

/**
 * An invalid authorization request. When its client and redirect URI are
 * valid, the user goes back to the client with the error; otherwise the
 * redirect URI cannot be trusted and the error is shown instead (RFC 6749
 * 4.1.2.1).
 */
export class AuthorizeError extends OAuthError {
  constructor(
    code: string,
    description: string,
    readonly redirectUri: string | null,
    readonly state?: string,
  ) {
    super(code, description);
  }
}
