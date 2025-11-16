import client, { routes } from '@/utils/axios';

import { CoachDashboardResponseDto } from '@openathlete/shared';

export class CoachAPI {
  static async getDashboard(
    start?: Date,
    end?: Date,
  ): Promise<CoachDashboardResponseDto> {
    const res = await client.get(
      routes.coach.dashboard(start?.toISOString(), end?.toISOString()),
    );
    return res.data;
  }

  static async getPendingInvitations(): Promise<
    Array<{
      coachInvitationId: number;
      email: string;
      token: string | null;
      status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
      athleteUserId: number;
      coachUserId: number | null;
      athleteUser: {
        userId: number;
        firstName: string;
        lastName: string;
        email: string;
      };
      createdAt: string;
      updatedAt: string;
    }>
  > {
    const res = await client.get(routes.coach.getPendingInvitations);
    return res.data;
  }

  static async acceptInvitation(invitationId: number): Promise<void> {
    await client.post(routes.coach.acceptInvitation(invitationId));
  }

  static async rejectInvitation(invitationId: number): Promise<void> {
    await client.post(routes.coach.rejectInvitation(invitationId));
  }
}
