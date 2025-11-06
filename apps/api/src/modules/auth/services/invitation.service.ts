import { Injectable } from '@nestjs/common';

import { AthleteInvitationService } from './athlete-invitation.service';

@Injectable()
export class InvitationService {
  constructor(
    private readonly athleteInvitationService: AthleteInvitationService,
  ) {}

  async verifyInvitationToken(token: string) {
    return this.athleteInvitationService.verifyInvitationToken(token);
  }
}
