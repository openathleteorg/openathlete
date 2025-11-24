import client, { routes } from '@/utils/axios';

import {
  Athlete,
  AthleteSettings,
  InviteCoachDto,
  TrainingZone,
  TrainingZoneValue,
  UpdateAthleteSettingsDto,
  User,
} from '@openathlete/shared';

export class AthleteAPI {
  static async getMyAthlete(): Promise<
    Athlete & {
      trainingZones: (TrainingZone & {
        values: TrainingZoneValue[];
      })[];
    }
  > {
    const res = await client.get(routes.athlete.getMyAthlete);
    return res.data;
  }

  static async getCoachedAthletes(): Promise<
    (Athlete & {
      trainingZones: (TrainingZone & {
        values: TrainingZoneValue[];
      })[];
    })[]
  > {
    const res = await client.get(routes.athlete.getCoachedAthletes);
    return res.data;
  }

  static async getMyCoaches(): Promise<User[]> {
    const res = await client.get(routes.athlete.getCoaches);
    return res.data;
  }

  static async inviteCoach(body: InviteCoachDto): Promise<void> {
    await client.post(routes.athlete.inviteCoach, body);
  }

  static async inviteAthlete(body: InviteCoachDto): Promise<void> {
    await client.post(routes.athlete.inviteAthlete, body);
  }

  static async removeAthlete(athleteId: number): Promise<void> {
    await client.delete(routes.athlete.removeAthlete(athleteId));
  }

  static async removeCoach(coachId: number): Promise<void> {
    await client.delete(routes.athlete.removeCoach(coachId));
  }

  static async getAthleteSettings(athleteId: number): Promise<AthleteSettings> {
    const res = await client.get(routes.athlete.getAthleteSettings(athleteId));
    return res.data;
  }

  static async updateAthleteSettings(
    athleteId: number,
    body: UpdateAthleteSettingsDto,
  ): Promise<AthleteSettings> {
    const res = await client.patch(
      routes.athlete.updateAthleteSettings(athleteId),
      body,
    );
    return res.data;
  }

  static async getPendingInvitations(): Promise<
    Array<{
      athleteInvitationId: number;
      email: string;
      token: string | null;
      status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
      userId: number;
      user: {
        userId: number;
        firstName: string;
        lastName: string;
        email: string;
      };
      createdAt: string;
      updatedAt: string;
    }>
  > {
    const res = await client.get(routes.athlete.getPendingInvitations);
    return res.data;
  }

  static async getSentAthleteInvitations(): Promise<
    Array<{
      athleteInvitationId: number;
      email: string;
      token: string | null;
      status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
      createdAt: string;
      updatedAt: string;
    }>
  > {
    const res = await client.get(routes.athlete.getSentAthleteInvitations);
    return res.data;
  }

  static async cancelAthleteInvitation(invitationId: number): Promise<void> {
    await client.delete(routes.athlete.cancelAthleteInvitation(invitationId));
  }

  static async getSentCoachInvitations(): Promise<
    Array<{
      coachInvitationId: number;
      email: string;
      token: string | null;
      status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
      createdAt: string;
      updatedAt: string;
    }>
  > {
    const res = await client.get(routes.athlete.getSentCoachInvitations);
    return res.data;
  }

  static async cancelCoachInvitation(invitationId: number): Promise<void> {
    await client.delete(routes.athlete.cancelCoachInvitation(invitationId));
  }

  static async acceptInvitation(invitationId: number): Promise<void> {
    await client.post(routes.athlete.acceptInvitation(invitationId));
  }

  static async rejectInvitation(invitationId: number): Promise<void> {
    await client.post(routes.athlete.rejectInvitation(invitationId));
  }
}
