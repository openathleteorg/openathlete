import client, { routes } from '@/utils/axios';

import {
  AuthResponseDto,
  FirebaseLoginDto,
  LoginDto,
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
