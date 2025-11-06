import client, { routes } from '@/utils/axios';

import { AuthResponseDto, LoginDto } from '@openathlete/shared';

export class AuthAPI {
  static async login(body: LoginDto): Promise<AuthResponseDto> {
    const res = await client.post(routes.auth.login, body);
    return res.data;
  }

  static async emailExists(email: string): Promise<boolean> {
    const res = await client.get(routes.auth.emailExists, {
      params: { email },
    });
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
