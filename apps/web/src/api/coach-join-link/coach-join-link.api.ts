import client, { routes } from '@/utils/axios';

import {
  AcceptCoachJoinLinkResponseDto,
  CoachJoinLinkDto,
  CoachJoinLinkInfoDto,
} from '@openathlete/shared';

export class CoachJoinLinkAPI {
  static async getMyLink(): Promise<CoachJoinLinkDto> {
    const res = await client.get(routes.coachJoinLink.get);
    return res.data;
  }

  static async rotate(): Promise<CoachJoinLinkDto> {
    const res = await client.post(routes.coachJoinLink.rotate);
    return res.data;
  }

  static async getInfo(token: string): Promise<CoachJoinLinkInfoDto> {
    const res = await client.get(routes.coachJoinLink.info(token));
    return res.data;
  }

  static async accept(token: string): Promise<AcceptCoachJoinLinkResponseDto> {
    const res = await client.post(routes.coachJoinLink.accept(token));
    return res.data;
  }
}
