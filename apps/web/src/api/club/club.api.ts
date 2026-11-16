import client, { routes } from '@/utils/axios';

import {
  AcceptClubJoinLinkResponseDto,
  AthleteGroupDto,
  ClubDetailDto,
  ClubInvitationDto,
  ClubJoinLinkInfoDto,
  ClubJoinLinkKind,
  ClubJoinLinksDto,
  ClubSessionDto,
  ClubSessionForEventDto,
  ClubSummaryDto,
  CreateAthleteGroupDto,
  CreateClubDto,
  CreateClubSessionDto,
  InviteToClubDto,
  InviteToClubResultDto,
  UpdateClubDto,
  UpdateClubJoinLinksDto,
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

  static async updateJoinLinks(
    clubId: number,
    body: UpdateClubJoinLinksDto,
  ): Promise<ClubJoinLinksDto> {
    return (await client.patch(routes.club.joinLinks(clubId), body)).data;
  }

  static async invite(
    clubId: number,
    body: InviteToClubDto,
  ): Promise<InviteToClubResultDto> {
    return (await client.post(routes.club.invitations(clubId), body)).data;
  }

  static async getInvitations(clubId: number): Promise<ClubInvitationDto[]> {
    return (await client.get(routes.club.invitations(clubId))).data;
  }

  static async resendInvitation(clubId: number, id: number): Promise<void> {
    await client.post(routes.club.resendInvitation(clubId, id));
  }

  static async revokeInvitation(clubId: number, id: number): Promise<void> {
    await client.delete(routes.club.invitation(clubId, id));
  }

  static async getSessions(clubId: number): Promise<ClubSessionDto[]> {
    return (await client.get(routes.club.sessions(clubId))).data;
  }

  static async createSession(
    clubId: number,
    body: CreateClubSessionDto,
  ): Promise<ClubSessionDto> {
    return (await client.post(routes.club.sessions(clubId), body)).data;
  }

  static async updateSession(
    clubId: number,
    id: number,
    body: CreateClubSessionDto,
  ): Promise<ClubSessionDto> {
    return (await client.put(routes.club.session(clubId, id), body)).data;
  }

  static async deleteSession(clubId: number, id: number): Promise<void> {
    await client.delete(routes.club.session(clubId, id));
  }

  static async cancelSessionOccurrence(
    clubId: number,
    id: number,
    date: string,
  ): Promise<ClubSessionDto> {
    return (await client.post(routes.club.cancelSession(clubId, id), { date }))
      .data;
  }

  static async getSessionForEvent(
    eventId: number,
  ): Promise<ClubSessionForEventDto> {
    return (await client.get(routes.clubSessions.forEvent(eventId))).data;
  }

  static async answerSession(
    eventId: number,
    going: boolean,
  ): Promise<ClubSessionForEventDto> {
    return (
      await client.put(routes.clubSessions.attendance, { eventId, going })
    ).data;
  }

  /** The athlete link a short code stands for */
  static async resolveCode(code: string): Promise<{ token: string }> {
    return (await client.get(routes.clubJoin.code(code))).data;
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
