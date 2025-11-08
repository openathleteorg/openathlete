import { Injectable } from '@nestjs/common';

import { AthleteInvitationService } from './athlete-invitation.service';
import { CoachInvitationService } from './coach-invitation.service';

@Injectable()
export class InvitationService {
  constructor(
    private readonly athleteInvitationService: AthleteInvitationService,
    private readonly coachInvitationService: CoachInvitationService,
  ) {}

  async verifyInvitationToken(token: string) {
    // Try athlete invitation first
    const athleteInvitation =
      await this.athleteInvitationService.verifyInvitationToken(token);
    if (athleteInvitation) {
      return athleteInvitation;
    }

    // Try coach invitation
    const coachInvitation =
      await this.coachInvitationService.verifyInvitationToken(token);
    if (coachInvitation) {
      return coachInvitation;
    }

    return null;
  }
}
