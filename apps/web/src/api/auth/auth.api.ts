import type { AuthSessionSnapshot } from '@/utils/auth-attempt';
import client, { routes } from '@/utils/axios';
import { getApiBaseUrl } from '@/utils/capacitor';

import {
  AuthResponseDto,
  EmailLanguage,
  FirebaseLoginDto,
  LoginDto,
  OidcExchangeDto,
  UnitSystem,
} from '@openathlete/shared';

export class AuthAPI {
  static async login(
    body: LoginDto,
    session?: AuthSessionSnapshot,
  ): Promise<AuthResponseDto> {
    const res = await client.post(
      routes.auth.login,
      body,
      session ? { authSession: session } : undefined,
    );
    return res.data;
  }

  static async loginWithFirebase(
    body: FirebaseLoginDto,
    session?: AuthSessionSnapshot,
  ): Promise<AuthResponseDto> {
    const res = await client.post(
      routes.auth.firebaseLogin,
      body,
      session ? { authSession: session } : undefined,
    );
    return res.data;
  }

  static async exchangeOidcCode(
    body: OidcExchangeDto,
    session?: AuthSessionSnapshot,
  ): Promise<AuthResponseDto> {
    const res = await client.post(
      routes.auth.oidcExchange,
      body,
      session ? { authSession: session } : undefined,
    );
    return res.data;
  }

  /** Where the browser goes to sign in with the instance's provider */
  static oidcSignInUrl(params: {
    invitation?: string;
    coachInvitation?: string;
    clubJoin?: string;
    language?: EmailLanguage;
    unitSystem?: UnitSystem;
  }): string {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        (entry): entry is [string, string] => !!entry[1],
      ),
    );
    return `${getApiBaseUrl()}${routes.auth.oidc}?${query}`;
  }

  static async verifyInvitation(token: string): Promise<{
    valid: boolean;
    email?: string;
  }> {
    const res = await client.get(routes.auth.verifyInvitation, {
      params: { token },
    });
    return res.data;
  }
}
