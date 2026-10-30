import type { ConnectorProvider } from '../../../entities';

/**
 * What this instance offers, for the app to hide what is not configured.
 * Public: the sign-in page needs it before anyone is signed in.
 */
export interface InstanceInfoDto {
  /** Sign-in with Google (Firebase) is configured on the API */
  googleSignIn: boolean;
  /** Emails can be sent: password reset links, invitations, digests */
  email: boolean;
  /** Connectors users can connect */
  providers: ConnectorProvider[];
  /** Per-user Garmin Personal API key setup; does not require shared OAuth credentials. */
  garminPersonalApi: boolean;
  /**
   * Who can create an account now: SIGNUP_MODE, except that an instance
   * without any account is open, for its administrator
   */
  signup: 'open' | 'invite' | 'closed';
  /** Sign-in through the instance's OpenID Connect provider, and its name */
  oidc: { name: string } | null;
}
