import client, { routes } from '@/lib/axios';

export interface BetaAccessRequestDto {
  name: string;
  email: string;
  type: 'coach' | 'club';
  athletes: string;
  message?: string;
}

export class BetaAccessAPI {
  static async request(body: BetaAccessRequestDto): Promise<void> {
    await client.post(routes.betaAccess.request, body);
  }
}
