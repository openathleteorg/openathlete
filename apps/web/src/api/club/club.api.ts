import client, { routes } from '@/utils/axios';

import {
  AcceptClubJoinLinkResponseDto,
  AthleteGroupDto,
  ClubDetailDto,
  ClubJoinLinkInfoDto,
  ClubJoinLinkKind,
  ClubJoinLinksDto,
  ClubSummaryDto,
  CreateAthleteGroupDto,
  CreateClubDto,
  UpdateClubDto,
  UpdateClubMemberDto,
} from '@openathlete/shared';

export class ClubAPI {
  static async listMine(): Promise<ClubSummaryDto[]> {
    return (await client.get(routes.club.list)).data;
  }

  static async create(body: CreateClubDto): Promise<ClubSummaryDto> {
    return (await client.post(routes.club.create, body)).data;
  }

  static async get(clubId: number): Promise<ClubDetailDto> {
    return (await client.get(routes.club.get(clubId))).data;
  }

  static async update(
    clubId: number,
    body: UpdateClubDto,
  ): Promise<ClubDetailDto> {
    return (await client.patch(routes.club.update(clubId), body)).data;
  }

  static async delete(clubId: number): Promise<void> {
    await client.delete(routes.club.delete(clubId));
  }

  static async updateMember(
    clubId: number,
    userId: number,
    body: UpdateClubMemberDto,
  ): Promise<ClubDetailDto> {
    return (await client.patch(routes.club.member(clubId, userId), body)).data;
  }

  /** Removes a member; with the user's own id, leaves the club */
  static async removeMember(clubId: number, userId: number): Promise<void> {
    await client.delete(routes.club.member(clubId, userId));
  }

  static async transfer(
    clubId: number,
    userId: number,
  ): Promise<ClubDetailDto> {
    return (await client.post(routes.club.transfer(clubId), { userId })).data;
  }

  static async getJoinLinks(clubId: number): Promise<ClubJoinLinksDto> {
    return (await client.get(routes.club.joinLinks(clubId))).data;
  }

  static async rotateJoinLink(
    clubId: number,
    kind: ClubJoinLinkKind,
  ): Promise<ClubJoinLinksDto> {
    return (await client.post(routes.club.rotateJoinLink(clubId), { kind }))
      .data;
  }

  static async getJoinInfo(token: string): Promise<ClubJoinLinkInfoDto> {
    return (await client.get(routes.clubJoin.info(token))).data;
  }

  static async acceptJoin(
    token: string,
  ): Promise<AcceptClubJoinLinkResponseDto> {
    return (await client.post(routes.clubJoin.accept(token))).data;
  }
}

export class AthleteGroupAPI {
  /** A club's groups, or the coach's own without clubId */
  static async list(clubId?: number): Promise<AthleteGroupDto[]> {
    return (
      await client.get(routes.athleteGroups.list, {
        params: clubId ? { clubId } : undefined,
      })
    ).data;
  }

  static async create(body: CreateAthleteGroupDto): Promise<AthleteGroupDto> {
    return (await client.post(routes.athleteGroups.create, body)).data;
  }

  static async rename(groupId: number, name: string): Promise<AthleteGroupDto> {
    return (await client.patch(routes.athleteGroups.group(groupId), { name }))
      .data;
  }

  static async delete(groupId: number): Promise<void> {
    await client.delete(routes.athleteGroups.group(groupId));
  }

  static async addAthletes(
    groupId: number,
    athleteIds: number[],
  ): Promise<AthleteGroupDto> {
    return (
      await client.post(routes.athleteGroups.athletes(groupId), { athleteIds })
    ).data;
  }

  static async removeAthlete(
    groupId: number,
    athleteId: number,
  ): Promise<AthleteGroupDto> {
    return (
      await client.delete(routes.athleteGroups.athlete(groupId, athleteId))
    ).data;
  }

  static async setStaff(
    groupId: number,
    userIds: number[],
  ): Promise<AthleteGroupDto> {
    return (await client.put(routes.athleteGroups.staff(groupId), { userIds }))
      .data;
  }
}
