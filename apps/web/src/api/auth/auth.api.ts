import client, { routes } from '@/utils/axios';
import { getApiBaseUrl } from '@/utils/capacitor';

import {
  AuthResponseDto,
  EmailLanguage,
  FirebaseLoginDto,
  LoginDto,
  OidcExchangeDto,
} from '@openathlete/shared';

export class AuthAPI {
  static async login(body: LoginDto): Promise<AuthResponseDto> {
    const res = await client.post(routes.auth.login, body);
    return res.data;
  }

  static async loginWithFirebase(
    body: FirebaseLoginDto,
  ): Promise<AuthResponseDto> {
    const res = await client.post(routes.auth.firebaseLogin, body);
    return res.data;
  }

  static async exchangeOidcCode(
    body: OidcExchangeDto,
  ): Promise<AuthResponseDto> {
    const res = await client.post(routes.auth.oidcExchange, body);
    return res.data;
  }

  /** Where the browser goes to sign in with the instance's provider */
  static oidcSignInUrl(params: {
    invitation?: string;
    coachInvitation?: string;
    clubJoin?: string;
    language?: EmailLanguage;
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
